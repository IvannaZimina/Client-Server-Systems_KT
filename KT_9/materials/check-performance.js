// C09 Ex6 — ETTE ANTUD proovijooks.  node check-performance.js
//
// ★ SEE JOOKS TEEB 2000 AJUTIST RIDA ja koristab nad ära.
import { makeTestPool, fillForTest, cleanTests, warmUp, clock } from './db.js';
import * as J from '../db/performance.js';

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

const pool = makeTestPool();
await cleanTests(pool);
const N = Number(process.env.ROWS ?? 2000);
await fillForTest(pool, N);
await warmUp(pool);

// ── 1. FILTREERIMINE MÄLUS vs ANDMEBAASIS ───────────────────────────────
const wrongly = await clock(() => J.listWRONG(pool, { search: 'Proovis', per: 20 }));
const rightly = await clock(() => J.list(pool, { search: 'Proovis', per: 20 }));
console.log(`   mälus lõikamine ${wrongly.ms} ms  |  andmebaasis ${rightly.ms} ms  (${N} rida)`);
on('mõlemad annavad 20 rida', [wrongly.rows.rows.length, rightly.rows.rows.length], [20, 20]);
on('mõlemad annavad sama kogusumma',
   Number(rightly.rows.total), wrongly.rows.total);

// ★ AUS MÄRKUS: 2000 rea peal on vahe väike — mõlemad on millisekundid.
//   VAHE EI OLE AJAS, vaid selles, MIDA KOOD TEEB: vale variant tõi KÕIK
//   read Node-i mällu. Sada tuhat rida on sada tuhat objekti, ja siis ei
//   ole enam küsimus kiiruses, vaid selles, kas protsess elab üle.
const [[{ n: rowCount }]] = await pool.query('SELECT COUNT(*) AS n FROM event');
on(`★ vale variant tõi mällu kõik ${rowCount} rida`, wrongly.rows.total <= rowCount, true);

// ── 2. LIMIT ILMA ORDER BY-ta ON MÄÄRAMATA ──────────────────────────────
const page1 = await J.list(pool, { page: 1, per: 10 });
const page2 = await J.list(pool, { page: 2, per: 10 });
const ids = new Set([...page1.rows, ...page2.rows].map((r) => r.id));
on('★ kaks lehekülge EI KORDA ühtki rida', ids.size, 20);
on('★ järjestus on TÄIELIK (teisene võti kaasas)',
   page1.rows.every((r, i) => i === 0 || page1.rows[i - 1].starts_at <= r.starts_at), true);

// ── 3. KURSORPÕHINE LEHEKÜLG ────────────────────────────────────────────
const first = J.cursorQuery({ per: 5 });
const [firstRows] = await pool.execute(first.sql, first.param);
on('esimene lehekülg tuleb ilma kursorita', firstRows.length, 5);
const last = firstRows[firstRows.length - 1];
const next = J.cursorQuery({ afterStart: last.starts_at, afterId: last.id, per: 5 });
const [nextRows] = await pool.execute(next.sql, next.param);
on('järgmine lehekülg tuleb kursori järgi', nextRows.length, 5);
on('★ kursor EI KORDA piiririda', nextRows.some((r) => r.id === last.id), false);

// ★ KÄIME KOGU TABELI KURSORIGA LÄBI. Proovisündmustel on ainult 12 eri
//   algusaega, seega langeb iga lehekülje piir keset ridu, mille starts_at on
//   SAMA. Ainult `starts_at > ?` jätaks need vahele, `starts_at >= ?` kordaks
//   neid. Kontrollitakse tulemust, mitte SQL-i kuju: `(starts_at, id) > (?, ?)`
//   ja `starts_at > ? OR (starts_at = ? AND id > ?)` on sama tingimus.
const [everyRow] = await pool.query('SELECT id FROM event ORDER BY starts_at ASC, id ASC');
const expected = everyRow.map((r) => r.id);
const walked = [];
let cursor = J.cursorQuery({ per: 7 });
for (let guard = 0; guard <= Math.ceil(expected.length / 7) + 2; guard += 1) {
  const [rows] = await pool.execute(cursor.sql, cursor.param);
  walked.push(...rows.map((r) => r.id));
  if (rows.length < 7) break;
  const end = rows[rows.length - 1];
  cursor = J.cursorQuery({ afterStart: end.starts_at, afterId: end.id, per: 7 });
}
on('★★ ja EI JÄTA VAHELE: kursor käib läbi kõik read, igaüks ÜKS kord, samas järjekorras',
   [walked.length, new Set(walked).size, walked.every((id, i) => id === expected[i])],
   [expected.length, expected.length, true]);

// ── 4. INDEKSI VASAKPOOLNE PREFIKS ──────────────────────────────────────
on('liitindeks (a,b), päring a järgi -> töötab', J.indexHelps(['a', 'b'], ['a']),
   { uses: true, columnsUsed: 1, full: false });
on('★★ liitindeks (a,b), päring AINULT b järgi -> EI TÖÖTA',
   J.indexHelps(['a', 'b'], ['b']).uses, false);
on('mõlemad veerud -> täielik', J.indexHelps(['a', 'b'], ['a', 'b']).full, true);
on('★ (a,b,c) päringule (a,c) kasutab AINULT a-d',
   J.indexHelps(['a', 'b', 'c'], ['a', 'c']).columnsUsed, 1);

// ★ Indeksi kasutust ei loeta tingimuse tekstist, vaid EXPLAIN-ist.
const month = await J.indexUsed(pool, 'MONTH(starts_at) = ?', [3]);
const range = await J.indexUsed(pool, 'starts_at >= ? AND starts_at < ?',
                                ['2026-03-01', '2026-04-01']);
const like = await J.indexUsed(pool, 'name LIKE ?', ['%kontsert%']);
on('★★ funktsioon veeru ümber: indeksist ei otsita', month.uses, false);
on('★ sama kuu vahemikuna: indeks töötab', [range.uses, range.key], [true, 'ix_event_starts_at']);
on('metamärk eesotsas: indeksist ei otsita', like.uses, false);
console.log(`   MONTH(starts_at): type=${month.type}  |  `
            + `vahemik: type=${range.type}, key=${range.key}`);

// ── 5. EXPLAIN — ainus viis TEADA ───────────────────────────────────────
const explain = async (sql, param = []) => (await pool.query('EXPLAIN ' + sql, param))[0][0];

const p1 = await explain("SELECT id FROM event WHERE name LIKE '%kontsert%'");
on('★ LIKE eesotsas metamärgiga -> täisskaneering', J.explainPlan(p1).ok, false);
// ALL loeb tabeli, index loeb terve indeksi (kui `name` on mõnes indeksis):
// mõlemad käivad kõik read läbi.
on('   ja EXPLAIN ütleb type=ALL või type=index', ['ALL', 'index'].includes(p1.type), true);
console.log(`   LIKE '%kontsert%': type=${p1.type}, key=${p1.key}, ridu=${p1.rows}`);

const p2 = await explain(
  "SELECT id FROM event WHERE starts_at > '2026-06-01' ORDER BY starts_at LIMIT 10");
on('★ indekseeritud veerg + ORDER BY sama veeru järgi -> indeks töötab',
   J.explainPlan(p2).ok, true);
on('   ja filesort jääb ära', String(p2.Extra ?? '').includes('filesort'), false);

const p3 = await explain('SELECT id FROM event ORDER BY price LIMIT 10');
on('★ sortimine indekseerimata veeru järgi -> hoiatus', J.explainPlan(p3).ok, false);

const p4 = await explain('SELECT id FROM event WHERE YEAR(starts_at) = 2026');
on('★★ funktsioon veeru ümber: `key` ON täidetud, aga see EI OLE hea uudis',
   [Boolean(p4.key), J.explainPlan(p4).ok], [true, false]);
console.log(`   YEAR(starts_at): type=${p4.type}, key=${p4.key}, ridu=${p4.rows}`);

on('★ type=index on terve indeksi lugemine, mitte otsing',
   (J.explainPlan({ type: 'index', key: 'ix', rows: 100 }).warnings[0] ?? '')
     .includes('type=index'), true);
on('filesort tuvastatakse',
   J.explainPlan({ type: 'ref', key: 'ix', Extra: 'Using filesort' }).ok, false);
on('vahetabel tuvastatakse',
   J.explainPlan({ type: 'ref', key: 'ix', Extra: 'Using temporary' }).ok, false);
on('type=ref indeksiga on korras', J.explainPlan({ type: 'ref', key: 'ix', Extra: '' }).ok, true);

// ── 6. KOONDPÄRING ──────────────────────────────────────────────────────
const one = await clock(() => pool.query(J.COMBINED_QUERY));
const three = await clock(async () => {
  await pool.query('SELECT COUNT(*) FROM event');
  await pool.query('SELECT COUNT(*) FROM event WHERE starts_at > NOW()');
  await pool.query('SELECT COALESCE(SUM(seat_count), 0) FROM event');
});
const combined = one.rows[0][0];
on('koondpäring annab viis välja', Object.keys(combined).length, 5);
on('★ tulevased + toimunud = kõik', Number(combined.upcoming) + Number(combined.past),
   Number(combined.events));
console.log(`   üks koondpäring ${one.ms} ms  |  kolm eraldi päringut ${three.ms} ms`);

on('koristamine viis kõik ajutised read ära', await cleanTests(pool), N);
await pool.end();
console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
