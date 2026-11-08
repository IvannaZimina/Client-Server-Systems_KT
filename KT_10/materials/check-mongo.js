// C10 Ex2 — ETTE ANTUD proovijooks.  node check-mongo.js
import { makeMongo, fillMongo, clearMongo, warmUp, clock } from './nosql.js';
import * as M from '../nosql/mongo.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 90000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s — keegi ootab midagi, mis ei tule.`);
  process.exit(1);
}, WATCHDOG_MS);

// ── 1. SEADED ───────────────────────────────────────────────────────────
const err = (env) => { try { M.readSettings(env); return null; } catch (e) { return e.message; } };
on('★ puuduv MONGO_DB nimetatakse ära', err({ MONGO_URL: 'x' })?.includes('MONGO_DB'), true);
on('terve seadistus läbib', M.readSettings({ MONGO_URL: 'u', MONGO_DB: 'd' }).db, 'd');

// ── 2. ★ FILTER ON ANDMED, MITTE TEKST ──────────────────────────────────
on('skalaar läbib', M.safeEquals('kala@ex.ee'), 'kala@ex.ee');
on('★ OPERAATOR kasutaja sisendis VISKAB',
   (() => { try { M.safeEquals({ $ne: null }); return 'did not throw'; }
            catch (e) { return e.constructor.name; } })(), 'TypeError');
on('null on lubatud', M.safeEquals(null), null);

const f = M.buildFilter({ search: 'Proovis' });
on('★ otsingumuster on ANKURDATUD algusesse', f.name.$regex.startsWith('^'), true);
on('★ regexi erimärgid on põgendatud', M.buildFilter({ search: '.*' }).name.$regex, '^\\.\\*');
on('hinnavahemik ehitatakse ühte objekti',
   M.buildFilter({ priceFrom: 10, priceTo: 20 }).price, { $gte: 10, $lte: 20 });
on('tühi filter on tühi objekt', M.buildFilter({}), {});

// ── 3. PÄRIS ANDMEBAAS ──────────────────────────────────────────────────
const { client, db } = await makeMongo();
const N = Number(process.env.ROWS ?? 2000);
await fillMongo(db, N);
await warmUp(db);
const indexes = await M.makeIndexes(db);
on('★ indeksid on olemas (pluss _id oma)', indexes.length, M.INDEXES.length + 1);

const page1 = await M.list(db, { page: 1, per: 10 });
const page2 = await M.list(db, { page: 2, per: 10 });
on('lehekülg annab kaupa ridu', page1.rows.length, 10);
on('total on kogu hulk', page1.total, N);
on('★ kaks lehekülge EI KORDA ühtki dokumenti',
   new Set([...page1.rows, ...page2.rows].map((d) => String(d._id))).size, 20);
on('★ PROJEKTSIOON jättis kohad välja', page1.rows[0].seats, undefined);
on('   aga küsitud väljad on kaasas',
   [typeof page1.rows[0].name, typeof page1.rows[0].price], ['string', 'number']);
on('pesastatud välja projektsioon toimib', typeof page1.rows[0].venue.name, 'string');
on('järjestus on kasvav',
   page1.rows.every((d, i) => i === 0 || page1.rows[i - 1].startsAt <= d.startsAt), true);

const searched = await M.list(db, { search: 'Proovisündmus 00001' });
on('otsing leiab täpse nime', searched.total, 1);
on('★ otsing, mis ei ole ALGUSES, ei leia midagi',
   (await M.list(db, { search: 'sündmus' })).total, 0);

// ── 3b. ★★ SKEEM ANDMEBAASIS, MITTE RAKENDUSES ───────────────────
await db.collection('trial').drop().catch(() => {});
const schema = await M.makeCollectionWithSchema(db, 'trial');
on('★ kollektsioon loodi koos validaatoriga', schema.created, true);
on('★ ja ta on RANGE, mitte hoiatav', [schema.level, schema.action], ['strict', 'error']);

const add = async (doc) => {
  try { await db.collection('trial').insertOne(doc); return 'PASSED'; }
  catch (e) { return e.code === 121 ? 'VALIDATION_ERROR' : `other error (${e.code})`; }
};
// ★★ `insertOne` MUUDAB SINU OBJEKTI — ta lisab talle `_id` KOHAPEAL.
//    Ma sain sellest teada nii, et kirjutasin `{ ...valid, newField }` ja
//    sain duplikaadivea 11000: `valid` kandis eelmise sisestuse `_id`-d
//    kaasa. Seepärast on siin TEHAS, mitte muutuja.
const valid = () => ({ name: 'Sügiskontsert', startsAt: new Date(), price: 24,
                        seatCount: 12, venue: { name: 'Vanemuine', city: 'Tartu' } });
on('korras dokument läheb läbi', await add(valid()), 'PASSED');
on('★★ puuduv kohustuslik väli KEELDUB',
   await add({ name: 'X', startsAt: new Date(), price: 1 }), 'VALIDATION_ERROR');
on('★★ vale tüüp (kuupäev sõnena) KEELDUB',
   await add({ ...valid(), startsAt: '2026-10-04' }), 'VALIDATION_ERROR');
on('★★ negatiivne hind KEELDUB', await add({ ...valid(), price: -1 }), 'VALIDATION_ERROR');
on('★★ null kohta KEELDUB', await add({ ...valid(), seatCount: 0 }), 'VALIDATION_ERROR');
on('★★ pesastatud objekti puuduv väli KEELDUB',
   await add({ ...valid(), venue: { name: 'X' } }), 'VALIDATION_ERROR');

// ★ JA TÕESTAME SELLE ÄRA, sest ta on päris lõks:
const beforeId = valid();
await db.collection('trial').insertOne(beforeId);
on('★★ insertOne LISAS `_id` MINU objektile', typeof beforeId._id, 'object');
// ★ AGA: täiesti VÕÕRAS väli läheb läbi — `$jsonSchema` ei keela vaikimisi
//   lisavälju. Selleks on `additionalProperties: false`, ja see on TEADLIK
//   valik: skeemita andmebaasi mõte ongi, et uus väli ei nõua migratsiooni.
on('★ tundmatu lisaväli on LUBATUD (ja see on tahtlik)',
   await add({ ...valid(), newField: 'midagi' }), 'PASSED');
await db.collection('trial').drop().catch(() => {});

// ── 4. EXPLAIN ──────────────────────────────────────────────────────────
const explain = async (filter, sort) => M.explainPlan(
  await db.collection('events').find(filter).sort(sort ?? {}).explain('executionStats'));

// ★★ HINDAJA, MIS EI SAA HINNATA, ÜTLEB SEDA VÄLJA — ta ei vaiki roheliseks.
//    `queryPlanner` ei sisalda vaadatud kirjete arvu, seega temast EI PIISA.
const withoutStats = M.explainPlan(
  await db.collection('events').find({}).explain('queryPlanner'));
on('★★ ilma executionStats-ita EI OLE hinnang võimalik', withoutStats.gradable, false);
on('   ja seda öeldakse välja, mitte ei vaikita roheliseks', withoutStats.ok, false);

const p1 = await explain({ startsAt: { $gte: new Date(0) } }, { startsAt: 1, _id: 1 });
on('★ indekseeritud väli + sama järjestus -> IXSCAN', p1.stages.includes('IXSCAN'), true);

const p2 = await explain({ soldTotal: 0 });
on('★ indekseerimata väli -> COLLSCAN', p2.warnings[0].includes('COLLSCAN'), true);

const p3 = await explain({}, { price: 1 });
on('★ sortimine indekseerimata välja järgi -> SORT-etapp', p3.ok, false);

// ★★ ANKURDAMATA REGEX: sama plaani NIMI, täiesti eri hind.
const anchored = await explain({ name: { $regex: '^Proovisündmus 001' } });
const unanchored = await explain({ name: { $regex: 'ndmus 001' } });
console.log(`   ankurdatud   ${anchored.stages.join('<-')}  vaatas ${anchored.examined} ` +
            `kirjet ${anchored.returned} rea jaoks (ratio ${anchored.ratio.toFixed(1)})`);
console.log(`   ankurdamata  ${unanchored.stages.join('<-')}  vaatas ${unanchored.examined} ` +
            `kirjet ${unanchored.returned} rea jaoks (ratio ${unanchored.ratio.toFixed(1)})`);
on('★★ MÕLEMAD kasutavad IXSCAN-i — etapi nimi neid EI ERISTA',
   [anchored.stages.includes('IXSCAN'), unanchored.stages.includes('IXSCAN')], [true, true]);
on('★★ aga ankurdatud on OK ja ankurdamata EI OLE',
   [anchored.ok, unanchored.ok], [true, false]);
on('★★ sest ankurdamata luges TERVE indeksi läbi', unanchored.examined >= N, true);
on('   ankurdatud vaatas vaid pisut rohkem, kui tagastas',
   anchored.ratio < M.RATIO_LIMIT, true);

const a = await clock(() => db.collection('events')
  .find({ name: { $regex: '^Proovisündmus 001' } }).toArray());
const b = await clock(() => db.collection('events')
  .find({ name: { $regex: 'ndmus 001' } }).toArray());
console.log(`   aeg: ankurdatud ${a.ms} ms  |  ankurdamata ${b.ms} ms  ` +
            `(mõlemad ${a.result.length} doc)`);
on('mõlemad leiavad SAMA arvu dokumente', a.result.length, b.result.length);

// ★ AUS MÄRKUS: 2000 dokumendi peal on AEG mõlemal sama suurusjärk. Vahe on
//   VAADATUD KIRJETES, ja just see kasvab koos andmehulgaga — aeg tuleb
//   järele hiljem. Sellepärast mõõdetaksegi plaani, mitte kella.

await clearMongo(db);
await client.close();
console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
