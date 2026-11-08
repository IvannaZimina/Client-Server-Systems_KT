// C09 Ex1 — ETTE ANTUD proovijooks.  node check-migrations.js
//
// ★ VAJAB TÖÖTAVAT MySQL-i. Vt db.js päist.
import { makeTestConn, reset } from './db.js';
import { migrate, seed, MIGRATIONS } from '../db/migrations.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

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

const u = await makeTestConn();

// ★ SEE FAIL LÄHTESTAB ANDMEBAASI. Ta viskab kõik tabelid ära ja ehitab nad
//   migratsioonidest uuesti üles — seega jooksuta ta ENNE teisi proovijookse.
//   Ilma selleta mõõdavad järgmised jooksud eelmise katse jäänuseid, mitte
//   sinu koodi. (Mõõdetud: minu enda pooleli jäänud katsed olid jätnud baasi
//   39 992 kohta, ja kaks proovijooksu „langesid“ korras koodi peal.)
console.log(`   lähtestasin: ${await reset(u)} tabelit visati ära`);

// ── 1. MIGRATSIOONID ────────────────────────────────────────────────────
const first = await migrate(u);
on('★ tühjast baasist jooksevad KÕIK migratsioonid',
   first.ran, MIGRATIONS.map((m) => m.v).sort((a, b) => a - b));
on('enne oli versioon 0', first.before, 0);
const second = await migrate(u);
on('★ teine jooks EI TEE MIDAGI (idempotentne)', second.ran, []);
on('versioon on kõrgeim migratsioon', second.after,
   Math.max(...MIGRATIONS.map((m) => m.v)));

const [tables] = await u.query('SHOW TABLES');
const names = tables.map((t) => Object.values(t)[0]).sort();
for (const table of ['user', 'venue', 'event', 'seat', 'orders', 'ticket', 'hold']) {
  on(`tabel ${table} on olemas`, names.includes(table), true);
}
on('★ jooksmine ON ANDMEBAASIS KIRJAS', names.includes('schema_version'), true);
const [versions] = await u.query('SELECT v, name FROM schema_version ORDER BY v');
on('iga migratsioon jättis rea', versions.length, MIGRATIONS.length);

// ── 2. SEEME ────────────────────────────────────────────────────────────
const counts = async () => {
  const out = [];
  for (const table of ['user', 'venue', 'event', 'seat']) {
    const [[{ n }]] = await u.query(`SELECT COUNT(*) AS n FROM ${table}`);
    out.push(Number(n));
  }
  return out;
};
await seed(u);
const once = await counts();
await seed(u);
on('★ teine seeme EI TEE DUPLIKAATE', await counts(), once);
on('seeme: 1 korraldaja, 1 koht, 1 sündmus, 12 kohta (3 rida x 4)', once, [1, 1, 1, 12]);

// ★★ Katkenud seeme: kolmas rida puudub. Järgmine jooks peab ta lõpuni viima,
//    mitte ütlema „andmed on juba olemas“.
await u.query('DELETE FROM seat WHERE row_no = 3');
await seed(u);
on('★★ pooleli jäänud seeme saab järgmisel jooksul lõpuni', await counts(), [1, 1, 1, 12]);

// ── 3. PIIRANGUD: kas andmebaas TÕESTI keeldub? ─────────────────────────
// ★ SEE ON KOGU ÜLESANDE MÕTE. Piirang, mida keegi ei ole proovinud
//   RIKKUDA, ei ole piirang — ta on kommentaar.
const test = async (sql, param = []) => {
  try { await u.execute(sql, param); return 'PASSED (ERROR!)'; }
  catch (e) { return e.code; }
};
const TOMORROW = '2026-12-01 19:00:00';

on('★ sama e-post kaks korda',
   await test('INSERT INTO user (email, name, password_hash) VALUES (?, ?, ?)',
                ['organizer@piletikassa.ee', 'Teine', 'x']),
   'ER_DUP_ENTRY');

on('★ sündmus olematus toimumiskohas',
   await test(`INSERT INTO event (venue_id, organizer_id, name, starts_at, seat_count, price)
                 VALUES (99999, 1, ?, ?, 10, 5.00)`, ['X', TOMORROW]),
   'ER_NO_REFERENCED_ROW_2');

on('★ sündmus, millel on null kohta',
   await test(`INSERT INTO event (venue_id, organizer_id, name, starts_at, seat_count, price)
                 SELECT v.id, u.id, ?, ?, 0, 5.00
                   FROM venue v, user u LIMIT 1`, ['X', TOMORROW]),
   'ER_CHECK_CONSTRAINT_VIOLATED');

on('★ negatiivne price',
   await test(`INSERT INTO event (venue_id, organizer_id, name, starts_at, seat_count, price)
                 SELECT v.id, u.id, ?, ?, 10, -1.00
                   FROM venue v, user u LIMIT 1`, ['X', TOMORROW]),
   'ER_CHECK_CONSTRAINT_VIOLATED');

const [[seat]] = await u.query('SELECT id FROM seat ORDER BY id LIMIT 1');
const [[user]] = await u.query('SELECT id FROM user ORDER BY id LIMIT 1');
const [orders] = await u.execute('INSERT INTO orders (user_id, state) VALUES (?, ?)',
                              [user.id, 'paid']);
await u.execute('INSERT INTO ticket (order_id, seat_id) VALUES (?, ?)', [orders.insertId, seat.id]);
on('★★ SAMA KOHT KAKS KORDA MÜÜDUD — kogu C09 tähtsaim piirang',
   await test('INSERT INTO ticket (order_id, seat_id) VALUES (?, ?)', [orders.insertId, seat.id]),
   'ER_DUP_ENTRY');

// ── 4. KUSTUTAMISE REEGLID ──────────────────────────────────────────────
// ★ ON DELETE CASCADE vs RESTRICT ei ole maitseasi. Kohad kaovad koos
//   sündmusega (CASCADE), aga kasutajat, kellel on oste, EI TOHI kustutada
//   (RESTRICT) — muidu jääb ost omanikuta.
on('★ kasutajat, kellel on ost, ei saa kustutada',
   await test('DELETE FROM user WHERE id = ?', [user.id]),
   'ER_ROW_IS_REFERENCED_2');

on('★ kohta, millel on pilet, ei saa kustutada',
   await test('DELETE FROM seat WHERE id = ?', [seat.id]),
   'ER_ROW_IS_REFERENCED_2');

await u.execute('DELETE FROM ticket WHERE order_id = ?', [orders.insertId]);
await u.execute('DELETE FROM orders WHERE id = ?', [orders.insertId]);

await u.end();
console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
