// C10 — ETTE ANTUD proovijooks.  node check-nosql.js
//
// ★ KONTROLLIB ETTE ANTUD FAILI nosql.js, mitte sinu koodi. Jooksuta teda
//   kohe pärast seda, kui oled nosql.js päises olevad kaks käsku täitnud:
//   kui see jooks on punane, ei ole ükski teine proovijooks usaldusväärne.
//
// ★ VAJAB AINULT MongoDB konteinerit (piletikassa-mongo, port 27019).
//   Firestore'i emulaatorit see jooks ei käivita; tema pool on check-firestore.js.
import { readFileSync } from 'node:fs';
import {
  MONGO_URL, FS_PORT, CITIES, makeMongo, replicaSet, trialEvent,
  fillMongo, clearMongo, warmUp, clock,
} from './nosql.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`); process.exit(1);
}, WATCHDOG_MS);

// ── 1. ÜHENDUS JA REPLIKATSIOONIKOMPLEKT ─────────────────────────────────
if (!process.env.MONGO_URL) on('vaikeaadress on päises nimetatud port', MONGO_URL,
  'mongodb://127.0.0.1:27019');
let client, db;
try {
  ({ client, db } = await makeMongo());
} catch (e) {
  console.log(`   !! MongoDB ei vasta aadressil ${MONGO_URL}: ${e.message}`);
  console.log('   Käivita konteiner nosql.js päises oleva käsuga ja proovi uuesti.');
  process.exit(1);
}
const set = await replicaSet(db);
console.log(`   replicaSet: ${set ?? 'EI OLE'}`);
on('★★ päise rs.initiate() andis komplekti rs0 — ilma temata ei tööta Ex5 tehingud',
   set, 'rs0');

// ── 2. PROOVIANDMED ─────────────────────────────────────────────────────
const e = trialEvent(7);
on('proovisündmuse id', e._id, 's00007');
on('kohti on 3 × 4', e.seats.length, 12);
on('seatCount vastab kohtade arvule', e.seatCount, e.seats.length);
on('ükski koht ei ole müüdud', e.seats.filter((k) => k.sold).length, 0);
on('linn tuleb CITIES-ist', CITIES.includes(e.venue.city), true);
on('startsAt on Date', e.startsAt instanceof Date, true);
on('★ sama number annab sama sündmuse', JSON.stringify(trialEvent(7)), JSON.stringify(e));

// ── 3. TÄITMINE JA TÜHJENDAMINE ─────────────────────────────────────────
const n = await fillMongo(db, 200);
on('fillMongo tagastab lisatud arvu', n, 200);
on('ja see arv on kollektsioonis', await db.collection('events').countDocuments({}), 200);
on('kõik neli linna on esindatud',
   (await db.collection('events').distinct('venue.city')).length, CITIES.length);

await db.collection('events').createIndex({ 'venue.city': 1 });
await clearMongo(db);
on('clearMongo tühjendab kollektsiooni', await db.collection('events').countDocuments({}), 0);
const left = (await db.collection('events').listIndexes().toArray()).map((i) => i.name);
on('★★ clearMongo võtab maha ka indeksid (alles jääb ainult _id)', left, ['_id_']);
let again = 'ei visanud';
try { await clearMongo(db); } catch (err) { again = err.message; }
on('teine tühjendus järjest ei viska', again, 'ei visanud');

// ── 4. ABIVAHENDID ──────────────────────────────────────────────────────
await warmUp(db, 2);
const t = await clock(async () => 42);
on('clock tagastab tulemuse', t.result, 42);
on('ja aja millisekundites', Number.isInteger(t.ms) && t.ms >= 0, true);

// ── 5. EMULAATORI PORT KLAPIB firebase.json-iga ─────────────────────────
const fb = JSON.parse(readFileSync(new URL('./firebase.json', import.meta.url), 'utf8'));
if (!process.env.FIRESTORE_PORT) on('FS_PORT on sama, mis firebase.json-is',
  FS_PORT, fb.emulators.firestore.port);

await client.close();
console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
