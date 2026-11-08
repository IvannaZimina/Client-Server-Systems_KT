// C09 Ex4 — ETTE ANTUD proovijooks.  node check-relations.js
//
// ★ SEE JOOKS TEEB 2000 AJUTIST RIDA ja koristab nad lõpus ära. Kolme
//   reaga on N+1 ja JOIN mõlemad „kiired“ — ja just seepärast jõuab N+1
//   tootmiseni.
import { createHash } from 'node:crypto';
import { makeTestPool, fillForTest, cleanTests, warmUp, clock, TEST_PREFIX } from './db.js';
import * as S from '../db/relations.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

// ★ Strateegia valik on siin SÕRMEJÄLJENA, mitte kirjas: see fail on sul käes,
//   ja valik on sinu teha. Vale lahtri korral ütleb kontroll, MIS juhtum.
const fingerprint = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const cellOk = (label, key, value, expected) => {
  if (fingerprint(`${key}:${value}`) === expected) ok++;
  else broken.push(`${label} ${key}: ${JSON.stringify(value)} ei pea paika`);
};

// ★ VALVUR. Andmebaasi vastu joostes on kaks viisi läbi kukkuda: vale
//   vastus ja MITTE ÜHTKI vastust. Teine on salakavalam — kui ühendust ei
//   vabastata (Ex2: kogumi ammendumine on VAIKNE) või kui lukk jääb lahti
//   (Ex5), ei tule viga, vaid EI TULE MIDAGI. Ilma valvurita seisab jooks
//   igavesti ja sa ei tea, MIDA oodatakse.
//
//   Mõõdetud: süsti `release()` kutse Ex5-st välja ja jooksuta ilma
//   valvurita — protsess ripub, kuni sa ta ise tapad.
const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 90000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s — keegi ootab midagi, mis ei tule.`);
  console.log('      Kahtlusta: vabastamata ühendus (`conn.release()`) või lahtine tehing.');
  process.exit(1);
}, WATCHDOG_MS);

const pool = makeTestPool();
await cleanTests(pool);           // eelmise katkenud jooksu jäänused
const PROBAND = 'paisumine@proov.ee';
const dropProband = async () => {
  const [[p]] = await pool.query('SELECT id FROM user WHERE email = ?', [PROBAND]);
  if (!p) return;
  await pool.execute('DELETE FROM orders WHERE user_id = ?', [p.id]);
  await pool.execute('DELETE FROM event WHERE organizer_id = ?', [p.id]);
  await pool.execute('DELETE FROM user WHERE id = ?', [p.id]);
};
await dropProband();
const N = Number(process.env.ROWS ?? 2000);
await fillForTest(pool, N);

// ★ Ilma müüdud kohtadeta annaks ka piletiteta loendus „õige“ vastuse. Proovi
//   ajaks müüakse esimese päris sündmuse kolm vaba kohta; lõpus võetakse
//   ost tagasi (piletid kustuvad ostuga koos).
const [[firstEvent]] = await pool.query(
  'SELECT id FROM event WHERE name NOT LIKE ? ORDER BY id LIMIT 1', [TEST_PREFIX + '%']);
const [[buyer]] = await pool.query('SELECT id FROM user ORDER BY id LIMIT 1');
const [order] = await pool.execute('INSERT INTO orders (user_id) VALUES (?)', [buyer.id]);
const [freeSeats] = await pool.query(
  `SELECT s.id FROM seat s LEFT JOIN ticket t ON t.seat_id = s.id
    WHERE s.event_id = ? AND t.id IS NULL ORDER BY s.id LIMIT 3`, [firstEvent.id]);
await pool.query('INSERT INTO ticket (order_id, seat_id) VALUES ?',
                 [freeSeats.map((s) => [order.insertId, s.id])]);
await warmUp(pool);

// ── 1. PÄRINGUTE ARV ────────────────────────────────────────────────────
const counter = () => ({ queries: 0 });
const l1 = counter(); const a = await clock(() => S.eventsN1(pool, l1));
const l2 = counter(); const b = await clock(() => S.eventsJoin(pool, l2));
const l3 = counter(); const c = await clock(() => S.eventsTwoQueries(pool, l3));

on('★ JOIN teeb ÜHE päringu', l2.queries, 1);
on('★ kaks päringut teeb KAKS', l3.queries, 2);
on('★★ N+1 teeb N+1 päringut', l1.queries, a.rows.length + 1);

// ── 2. KÕIK KOLM ANNAVAD SAMA VASTUSE ───────────────────────────────────
// ★ SEE ON KOGU MÕTE. Kiirus ei loe, kui vastus muutub.
on('sama arv ridu', [a.rows.length, b.rows.length, c.rows.length],
   [a.rows.length, a.rows.length, a.rows.length]);
// Võrdlusalus on antud JOIN; vastus nimetab esimese sündmuse, kus vabade arv erineb.
const firstDiff = (rows) => {
  const want = new Map(b.rows.map((r) => [String(r.id), String(r.free)]));
  const bad = rows.find((r) => want.get(String(r.id)) !== String(r.free));
  if (!bad) return 'sama';
  return `sündmus ${bad.id}: vabu ${bad.free}, JOIN-i järgi ${want.get(String(bad.id))}`;
};
on('★ N+1 ja JOIN annavad SAMA vabade arvu', firstDiff(a.rows), 'sama');
on('★ ja kaks päringut samuti', firstDiff(c.rows), 'sama');
on('★ LEFT JOIN hoiab alles ka müügita sündmused',
   b.rows.filter((r) => r.sold === 0).length > 0, true);

console.log(`   ${a.rows.length} sündmust:`);
console.log(`   N+1           ${String(l1.queries).padStart(5)} päringut  `
            + `${String(a.ms).padStart(5)} ms`);
console.log(`   JOIN          ${String(l2.queries).padStart(5)} päringut  `
            + `${String(b.ms).padStart(5)} ms`);
console.log(`   kaks päringut ${String(l3.queries).padStart(5)} päringut  `
            + `${String(c.ms).padStart(5)} ms`);
console.log(`   ★ N+1 on ${(a.ms / Math.max(b.ms, 1)).toFixed(1)} korda aeglasem kui JOIN`);

// ★ Andmebaas on SAMAS masinas ja täiesti tühi. Üle võrgu, koormuse all,
//   on vahe SUUREM — iga päring maksab ka võrgu edasi-tagasi aja.
on('★ N+1 on mõõdetavalt aeglasem', a.ms > b.ms, true);

// ── 3. KARTEESIA PAISUMINE ──────────────────────────────────────────────
// ★ Proovikasutaja: 3 tellimust ja 2 sündmust, mida ta korraldab. Kaks eri
//   last samalt vanemalt. Lõpus kustutatakse kõik kolm liiki ridu.
const [proband] = await pool.execute(
  'INSERT INTO user (email, name, password_hash) VALUES (?, ?, ?)',
  [PROBAND, 'Proovikasutaja', 'x']);
const probandId = proband.insertId;
for (let i = 0; i < 3; i += 1) {
  await pool.execute('INSERT INTO orders (user_id) VALUES (?)', [probandId]);
}
for (const name of ['Paisumise proov A', 'Paisumise proov B']) {
  await pool.execute(
    `INSERT INTO event (venue_id, organizer_id, name, starts_at, seat_count, price)
     SELECT venue_id, ?, ?, starts_at, 10, 5.00 FROM event WHERE id = ?`,
    [probandId, name, firstEvent.id]);
}
const measured = await S.bloat(pool, probandId);
on('★ kaks last ühelt vanemalt: COUNT loeb 3 × 2 = 6 rida', measured.counted, 6);
on('★★ COUNT(DISTINCT) loeb iga lapse üks kord', [measured.orders, measured.events], [3, 2]);
await dropProband();

// ── 4. VALIK ────────────────────────────────────────────────────────────
cellOk('strateegia', 'aggregate', S.suggestStrategy({ relationKind: 'aggregate' }),
       '3dc99019a6f0');
cellOk('strateegia', 'oneToOne', S.suggestStrategy({ relationKind: 'one_to_one' }),
       '69b4e501afaf');
cellOk('★ strateegia', 'manyFieldsManyChildren',
       S.suggestStrategy({ relationKind: 'one_to_many', parentFields: 10, childrenAvg: 50 }),
       '6f04a2bfaa2a');
cellOk('strateegia', 'fewChildren',
       S.suggestStrategy({ relationKind: 'one_to_many', parentFields: 10, childrenAvg: 2 }),
       '7600c6707c2c');
// Vabatekst: suur- ja väiketäht ega lõpupunkt ei loe.
const fits = String(S.CHOICE?.n_plus_1?.fits ?? '').trim().replace(/[.!]$/, '').toUpperCase();
cellOk('★ millal N+1 sobib', 'n_plus_1.fits', fits, '0a03430d10ec');

await pool.execute('DELETE FROM orders WHERE id = ?', [order.insertId]);
on('koristamine viis kõik ajutised read ära', await cleanTests(pool), N);
await pool.end();
console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
