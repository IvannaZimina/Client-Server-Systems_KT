// C09 Ex5 — ETTE ANTUD proovijooks.  node check-transaction.js
//
// ★★ SEE ON KURSUSE KÕIGE OLULISEM MÕÕTMINE. Sada ostjat, üks koht.
//    Kaks koodi, mis mõlemad „töötavad“ — ja ainult üks neist müüb ühe
//    pileti.
import { createHash } from 'node:crypto';
import { makeTestPool, cleanOrders } from './db.js';
import { buy, buyWRONG, buyMany, translateError, orderLocks, ERROR_CODES, TX_BEGIN }
  from '../db/transaction.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

// ★ Veakoodide HTTP-koodid on siin SÕRMEJÄLJENA, mitte kirjas: see fail on sul
//   käes, ja tabel on sinu teha. Vale lahtri korral ütleb kontroll, MIS kood.
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

const BUYERS = Number(process.env.BUYERS ?? 100);
const pool = makeTestPool();
const [[seat]] = await pool.query('SELECT id FROM seat ORDER BY id LIMIT 1');
const [[user]] = await pool.query('SELECT id FROM user ORDER BY id LIMIT 1');
const tickets = async () => (await pool.query(
  'SELECT COUNT(*) AS n FROM ticket WHERE seat_id = ?', [seat.id]))[0][0].n;

const runTogether = (f) => Promise.allSettled(Array.from({ length: BUYERS }, () => f()));
const count = (rows, f) => rows.filter(f).length;

// ── 1. VALE KOOD: KONTROLL RAKENDUSES ───────────────────────────────────
await cleanOrders(pool);
const wrong = await runTogether(
  () => buyWRONG(pool, { userId: user.id, seatId: seat.id }));
const wrongSold = await tickets();
const wrongThrows = count(wrong, (x) => x.status === 'rejected');

console.log(`   buyWRONG: ${wrongSold} piletit, ${wrongThrows} viset 500-ga`);
on('★★ UNIQUE indeks päästab ANDMED ka vale koodi puhul', wrongSold, 1);
on('★★ AGA kasutajad said vea: ' + wrongThrows + ' viset', wrongThrows > 0, true);
on('★ ja need vead on ANDMEBAASI vead, mitte ärilised',
   translateError(wrong.find((x) => x.status === 'rejected').reason).kind, 'duplicate');

// ★ MIS SIIS, KUI INDEKSIT EI OLEKS? Võtame ta hetkeks ära ja mõõdame.
//   SEE ON AINUS KOHT KOGU KURSUSEL, kus me piirangu meelega eemaldame.
await cleanOrders(pool);

// ★ ESIMENE ÜLLATUS: indeksit EI SAA niisama ära võtta. Võõrvõti
//   `fk_ticket_seat` VAJAB indeksit veerul `seat_id`, ja `uq_ticket_seat` on
//   ainus, mis seda annab. MySQL keeldub.
const denial = await pool.query('ALTER TABLE ticket DROP INDEX uq_ticket_seat')
  .then(() => 'passed', (e) => e.code);
on('★ võõrvõtme jaoks vajalikku indeksit ei saa kustutada', denial, 'ER_DROP_INDEX_FK');

// Anname võõrvõtmele asendusindeksi ja alles siis võtame unikaalsuse ära.
await pool.query('ALTER TABLE ticket ADD KEY ix_temp_seat (seat_id)');
await pool.query('ALTER TABLE ticket DROP INDEX uq_ticket_seat');
try {
  await runTogether(() => buyWRONG(pool, { userId: user.id, seatId: seat.id }));
  const without = await tickets();
  console.log(`   ilma indeksita: ${without} piletit ÜHE koha peale`);
  on('★★★ ILMA INDEKSITA MÜÜDI ÜKS KOHT MITU KORDA', without > 1, true);
} finally {
  await cleanOrders(pool);
  await pool.query('ALTER TABLE ticket ADD UNIQUE KEY uq_ticket_seat (seat_id)');
  await pool.query('ALTER TABLE ticket DROP INDEX ix_temp_seat');
}

// ── 2. ÕIGE KOOD: TEHING + FOR UPDATE ───────────────────────────────────
await cleanOrders(pool);
const correct = await runTogether(
  () => buy(pool, { userId: user.id, seatId: seat.id }));
const correctSold = await tickets();
const succeeded = count(correct, (x) => x.status === 'fulfilled' && x.value.ok);
const refused = count(correct, (x) => x.status === 'fulfilled' && !x.value.ok);
const threw = count(correct, (x) => x.status === 'rejected');

console.log(`   buy: ${correctSold} piletit, ${succeeded} õnnestus, `
            + `${refused} keeldumist, ${threw} viset`);
on('★★ tehinguga müüdi TÄPSELT ÜKS pilet', correctSold, 1);
on('★★ täpselt üks ostja sai „ok“', succeeded, 1);
on('★★ ülejäänud said PUHTA äriliste vastuse', refused, BUYERS - 1);
on('★★ MITTE ÜKSKI ei saanud viga', threw, 0);
on('keeldumise põhjus on inimkeelne',
   correct.find((x) => x.value && !x.value.ok).value.reason, 'koht on müüdud');

// ★★ MIDA `FOR UPDATE` PARANDAB — JA MIDA MITTE.
//    MÕÕDETUD: võta `FOR UPDATE` ära ja kõik neli numbrit ülalpool jäävad
//    TÄPSELT SAMAKS: 1 pilet, 1 õnnestumine, 99 keeldumist, 0 viset. Ma
//    ootasin, et vigade arv kargab üles — ta ei karganud, sest unikaalne
//    indeks püüab kõik kinni ja `translateError` teeb duplikaadist viisaka
//    ärilise vastuse.
//
//    VAHE ON SELLES, MIDA ANDMEBAAS TEEB. Lukuga näeb kaotaja pileti enne
//    kirjutamist — TÄPSELT NULL duplikaadierindit. Lukuta jõuab osa neist
//    INSERT-ini ja veeretatakse tagasi: ühel mõõdetud jooksul 29 sajast.
//
// ★★ SEEPÄRAST KONTROLLITAKSE LUKKU OTSE, mitte arvude järgi.
//    1. Esimene ühendus võtab piletitabelis LÜNALUKU (`FOR UPDATE` pileti
//       peale, mida ei ole). buy() jääb nüüd pileti INSERT-i peal ootama —
//       ja selleks ajaks on ta koha juba lukustanud, kui ta seda üldse teeb.
//    2. Teine ühendus küsib sama koha rida `FOR SHARE NOWAIT`-iga. Kui buy()
//       hoiab kohta `FOR UPDATE`-iga, tuleb kohe ER_LOCK_NOWAIT. Lukuta
//       buy() puhul saab ta rea kätte.
//    `FOR SHARE`, mitte `FOR UPDATE`: pileti INSERT paneb võõrvõtme
//    kontrolliks kohale JAGATUD luku ka lukuta koodis, ja see ei tohi
//    kontrolli ära petta.
await cleanOrders(pool);
const gapHolder = await pool.getConnection();
const prober = await pool.getConnection();
let lockSeen;
let heldAnswer;
try {
  await gapHolder.beginTransaction();
  await gapHolder.execute('SELECT id FROM ticket WHERE seat_id = ? FOR UPDATE', [seat.id]);
  const held = buy(pool, { userId: user.id, seatId: seat.id });
  held.catch(() => {});
  let waiting = 0;
  for (let i = 0; i < 150 && waiting === 0; i += 1) {
    await new Promise((r) => setTimeout(r, 20));
    const [[w]] = await prober.query(
      "SELECT COUNT(*) AS n FROM information_schema.innodb_trx WHERE trx_state = 'LOCK WAIT'");
    waiting = Number(w.n);
  }
  await prober.beginTransaction();
  lockSeen = await prober.execute('SELECT id FROM seat WHERE id = ? FOR SHARE NOWAIT', [seat.id])
    .then(() => 'rida saadi kohe',
          (e) => (e.code === 'ER_LOCK_NOWAIT' || e.errno === 3572 ? 'ER_LOCK_NOWAIT' : e.code));
  await prober.rollback();
  await gapHolder.rollback();
  heldAnswer = await held.then((v) => v?.ok, (e) => e.code ?? e.message);
} finally {
  gapHolder.release();
  prober.release();
}
console.log(`   koha rida buy() ajal: ${lockSeen}`);
on('★★ buy() HOIAB kohta lukus: teine tehing saab ER_LOCK_NOWAIT', lockSeen, 'ER_LOCK_NOWAIT');
on('   ja ootama jäänud ost lõpetas pärast lukust vabanemist', heldAnswer, true);

// ── 3. VEAD ON ÄRISÜNDMUSED ─────────────────────────────────────────────
const dup = translateError({ code: 'ER_DUP_ENTRY',
  sqlMessage: "Duplicate entry '7' for key 'uq_ticket_seat'" });
on('★ duplikaat on 409, mitte 500', dup.http, 409);
on('★ ja teade ütleb, MILLINE väli', dup.field, 'seat');
on('e-posti duplikaat tuvastatakse eraldi',
   translateError({ code: 'ER_DUP_ENTRY', sqlMessage: "key 'uq_user_email'" }).field, 'email');
const httpOf = (code) => String(translateError({ code }).http);
cellOk('puuduv viide: HTTP', 'ER_NO_REFERENCED_ROW_2',
       httpOf('ER_NO_REFERENCED_ROW_2'), '0a81328d1400');
cellOk('viidatud rida: HTTP', 'ER_ROW_IS_REFERENCED_2',
       httpOf('ER_ROW_IS_REFERENCED_2'), '42f3fa5668dc');
cellOk('★ CHECK-piirangu rikkumine: HTTP', 'ER_CHECK_CONSTRAINT_VIOLATED',
       httpOf('ER_CHECK_CONSTRAINT_VIOLATED'), '2137d6a5bd55');
cellOk('★ liiga pikk väärtus: HTTP', 'ER_DATA_TOO_LONG',
       httpOf('ER_DATA_TOO_LONG'), '25d65ae563ea');
cellOk('★ tundmatu kood: HTTP', 'SOMETHING_ELSE', httpOf('SOMETHING_ELSE'), '39af7d673bb0');
on('★ ummikseisu TOHIB korrata', translateError({ code: 'ER_LOCK_DEADLOCK' }).retryable, true);
cellOk('★ ummikseis, mis ka kordamisel ei lahenenud: HTTP', 'ER_LOCK_DEADLOCK',
       httpOf('ER_LOCK_DEADLOCK'), 'f577798eabed');
on('★ duplikaati EI TOHI korrata (ta ei muutu õigeks)',
   translateError({ code: 'ER_DUP_ENTRY' }).retryable, false);
on('iga kood on 4xx või 5xx',
   Object.values(ERROR_CODES).every((v) => v.http >= 400 && v.http < 600), true);

// ── 4. UMMIKSEIS ────────────────────────────────────────────────────────
on('★ lukud kasvavas järjekorras, duplikaadid välja', orderLocks([5, 2, 9, 2]), [2, 5, 9]);
on('juba järjestatu ei muutu', orderLocks([1, 2, 3]), [1, 2, 3]);

// ★ KORDAJA ON ETTE ANTUD (materials/retry.js). Kontrollitakse järgmist
//   kihti: buyMany ostab mitu kohta ÜHE tehinguna, lukustab nad samas
//   järjekorras ja kordab TERVET tehingut, kui ta ummikseisu ohvriks valiti.
const seats = (await pool.query('SELECT id FROM seat ORDER BY id LIMIT 11'))[0].map((r) => r.id);
const soldOf = async (ids) => (await pool.query(
  'SELECT COUNT(*) AS n FROM ticket WHERE seat_id IN (?)', [ids]))[0][0].n;

await cleanOrders(pool);
const two = await buyMany(pool, { userId: user.id, seatIds: [seats[2], seats[1]] });
on('buyMany ostab kaks kohta ühe tehinguna',
   [two.ok, await soldOf([seats[1], seats[2]])], [true, 2]);
const half = await buyMany(pool, { userId: user.id, seatIds: [seats[3], seats[2]] });
on('★ kõik või mitte midagi: üks koht müüdud -> vaba koht jääb vabaks',
   [half.ok, await soldOf([seats[3]])], [false, 0]);

// ★ Vastassuunas ostud. Metrik lock_deadlocks loeb ummikseise serveris.
await pool.query("SET GLOBAL innodb_monitor_enable = 'lock_deadlocks'");
const deadlocks = async () => Number((await pool.query(
  "SELECT `COUNT` AS n FROM information_schema.INNODB_METRICS "
  + "WHERE NAME = 'lock_deadlocks'"))[0][0].n);
const before = await deadlocks();
let crossThrew = 0;
let crossSold = 0;
for (let round = 0; round < 3; round += 1) {
  await cleanOrders(pool);
  const pairs = [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]].map(([a, b]) => [seats[a], seats[b]]);
  const answers = await Promise.allSettled(pairs.flatMap(([a, b]) => [
    buyMany(pool, { userId: user.id, seatIds: [a, b] }),
    buyMany(pool, { userId: user.id, seatIds: [b, a] })]));
  crossThrew += count(answers, (x) => x.status === 'rejected');
  crossSold += await soldOf(pairs.flat());
}
const crossDeadlocks = (await deadlocks()) - before;
console.log(`   vastassuunas ostud: ${crossDeadlocks} ummikseisu, ${crossThrew} viset`);
on('★★ vastassuunas ostud: ükski ei visanud', crossThrew, 0);
on('★★ ja iga koht müüdi täpselt üks kord (3 vooru × 10 kohta)', crossSold, 30);
on('★★ lukud samas järjekorras: ükski ummikseis ei tekkinud', crossDeadlocks, 0);

// ★ Ohver. Proovijooks hoiab kohta B ja on teinud kümme kirjutust — raskem
//   tehing. buyMany([A, B]) lukustab A ja ootab B-d. Kui proovijooks nüüd A-d
//   küsib, on ring kinni ja MySQL veeretab tagasi KERGEMA: buyMany.
await cleanOrders(pool);
const heavy = await pool.getConnection();
let heavyGot;
let victimAnswer;
try {
  await heavy.beginTransaction();
  for (let i = 0; i < 10; i += 1) {
    await heavy.execute('INSERT INTO orders (user_id, state) VALUES (?, ?)', [user.id, 'paid']);
  }
  await heavy.execute('SELECT id FROM seat WHERE id = ? FOR UPDATE', [seats[2]]);
  const pending = buyMany(pool, { userId: user.id, seatIds: [seats[1], seats[2]] });
  pending.catch(() => {});
  for (let i = 0, waiting = 0; i < 150 && waiting === 0; i += 1) {
    await new Promise((r) => setTimeout(r, 20));
    const [[w]] = await pool.query(
      "SELECT COUNT(*) AS n FROM information_schema.innodb_trx WHERE trx_state = 'LOCK WAIT'");
    waiting = Number(w.n);
  }
  heavyGot = await heavy.execute('SELECT id FROM seat WHERE id = ? FOR UPDATE', [seats[1]])
    .then(() => 'lukk saadi', (e) => e.code);
  await heavy.rollback();
  victimAnswer = await pending.then((v) => v?.ok, (e) => e.code ?? e.message);
} finally {
  heavy.release();
}
on('★★ ummikseisu ohver korras TERVET tehingut ja ost õnnestus',
   [heavyGot, victimAnswer], ['lukk saadi', true]);

// ── 5. MIS TEHINGU SISSE EI KUULU ───────────────────────────────────────
on('★ HTTP-päring ei kuulu tehingusse',
   TX_BEGIN.outside.includes('HTTP-päring'), true);
on('SELECT ... FOR UPDATE kuulub', TX_BEGIN.inside.includes('SELECT ... FOR UPDATE'), true);

// ★ JA SEE ON MÕÕDETAV: tehing, mille sees oodatakse, hoiab lukku.
await cleanOrders(pool);
const u1 = await pool.getConnection();
await u1.beginTransaction();
await u1.execute('SELECT id FROM seat WHERE id = ? FOR UPDATE', [seat.id]);
const t0 = performance.now();
const second = buy(pool, { userId: user.id, seatId: seat.id });
await new Promise((r) => setTimeout(r, 300));      // „maksefirma vastab 300 ms“
await u1.rollback(); u1.release();
await second;
const waited = performance.now() - t0;
console.log(`   teine ostja ootas lukku ${Math.round(waited)} ms`);
on('★★ lahtine tehing PANEB TEISE OOTAMA — täpselt nii kaua, kui ta kestab',
   waited > 250, true);

await cleanOrders(pool);
await pool.end();
console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
