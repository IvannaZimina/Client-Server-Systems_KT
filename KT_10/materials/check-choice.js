// C10 Ex6 — ETTE ANTUD proovijooks.  node check-choice.js
import { createHash } from 'node:crypto';
import { makeMongo, clearMongo, trialEvent } from './nosql.js';
import * as V from '../nosql/choice.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

// ★ Andmebaasi soovitused on siin SÕRMEJÄLJENA, mitte kirjas: see fail on sul
//   käes, ja valik on sinu teha. Vale lahtri korral ütleb kontroll, MIS juhtum.
const fingerprint = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const cellOk = (label, key, value, expected) => {
  if (fingerprint(`${key}:${value}`) === expected) ok++;
  else broken.push(`${label} ${key}: ${JSON.stringify(value)} ei pea paika`);
};

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 90000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`); process.exit(1);
}, WATCHDOG_MS);

// ── 1. LIIDES ON SEE, MIDA TEENUSEKIHT NÄEB ─────────────────────────────
on('liides on kuus meetodit', V.INTERFACE.length, 6);
on('★ liides ei nimeta ühtki taustaspetsiifilist mõistet',
   V.INTERFACE.some((m) => /_id|mongo|firestore|sql|snapshot/i.test(m)), false);

const incomplete = { findAll: () => {}, findById: () => {} };
on('★ puudulik taust tuvastatakse', V.backendFits(incomplete).fits, false);
on('   ja puuduvad meetodid nimetatakse ÄRA', V.backendFits(incomplete).missing.length, 4);
on('★ ja tühja taustaga ei õnnestu keegi', V.backendFits(null).fits, false);

// ── 2. C09 Ex3 LIIDES PÄRIS MONGO PEAL ──────────────────────────────────
// ★ Sama kuus meetodit (findAll, readTotal, findById, add, update, remove) ja
//   samad väljanimed (starts_at, seat_count) mis C09 Ex3 repositooriumil.
//   Dokumendis on nad Mongo kujul (startsAt, seatCount); tõlge elab taustas.
const { client, db } = await makeMongo();
await clearMongo(db);
for (let i = 1; i <= 5; i += 1) await db.collection('events').insertOne(trialEvent(i));

const backend = V.mongoBackend(db);
on('★★ mongoBackend rahuldab liidest TÄIELIKULT', V.backendFits(backend).fits, true);

const all = await backend.findAll({ per: 3 });
on('findAll austab piiri', all.length, 3);
on('★★ ja väljundis EI OLE `_id` — ainult `id`',
   [all[0]._id, typeof all[0].id], [undefined, 'string']);
on('id on sõne, mitte objekt', typeof all[0].id, 'string');
on('★★ väljad on C09 Ex3 kujul: starts_at ja seat_count, mitte Mongo omad',
   ['starts_at' in all[0], 'seat_count' in all[0], 'startsAt' in all[0], 'seatCount' in all[0]],
   [true, true, false, false]);
on('readTotal annab kõik', await backend.readTotal(), 5);

const one = await backend.findById(all[0].id);
on('findById leiab sama', one.name, all[0].name);
on('★ olematu id -> null (sama leping mis C09 Ex3-s)', await backend.findById('ei-ole'), null);

const fresh = await backend.add({ id: 'uus1', name: 'Uus sündmus', price: 15, seat_count: 10 });
on('add annab TERVE objekti', fresh.name, 'Uus sündmus');
on('★ add võtab C09 väljanimed ja salvestab nad Mongo kujul',
   [fresh.seat_count, (await db.collection('events').findOne({ _id: 'uus1' })).seatCount],
   [10, 10]);
const changed = await backend.update('uus1', { price: 18 });
on('muutmine töötab', changed.price, 18);
on('★ olematu rea muutmine -> null', await backend.update('ei-ole', { price: 1 }), null);
on('kustutamine õnnestub', await backend.remove('uus1'), true);
on('★ teine kustutamine -> false', await backend.remove('uus1'), false);

// ── 3. MIS PORTEERUB JA MIS EI ──────────────────────────────────────────
on('★ porteeruvate ja mitteporteeruvate nimekirjad on mõlemad olemas',
   [V.PORTABLE.yes.length >= 4, V.PORTABLE.no.length >= 5], [true, true]);
on('★★ reaalajakuulaja EI PORTEERU',
   V.PORTABLE.no.some((x) => x.includes('reaalaja')), true);
on('★★ skeemipiirangud EI PORTEERU',
   V.PORTABLE.no.some((x) => x.includes('skeemipiirangud')), true);
on('★ CRUD porteerub', V.PORTABLE.yes.some((x) => x.includes('CRUD')), true);

// ── 4. VALIKUKRITEERIUMID ───────────────────────────────────────────────
on('★ iga kriteerium on KÜSIMUS, mitte omadus',
   V.CRITERIA.every((k) => k.question.endsWith('?')), true);
on('★ ja igal on vastus kõigi KOLME kohta',
   V.CRITERIA.every((k) => k.sql && k.mongo && k.firestore), true);
on('kriteeriume on viis', V.CRITERIA.length, 5);
on('★ Firestore EI OSKA aruandeid — see on kirjas',
   V.CRITERIA.find((k) => k.question.includes('aruande')).firestore.includes('EI OSKA'), true);

cellOk('★ soovitus', 'strictReports',
       V.advise({ strictConsistency: true, reports: true }), '9c97ec889e8e');
cellOk('★ soovitus', 'realtimeNoReports',
       V.advise({ strictConsistency: false, reports: false, realtime: true }), '05f4b63a13f1');
cellOk('★ soovitus', 'shapeChangesReports',
       V.advise({ strictConsistency: false, reports: true, realtime: false, shapeStable: false }),
       'c155339292b3');
cellOk('soovitus', 'strictOnly',
       V.advise({ strictConsistency: true, reports: false,
                 realtime: false, shapeStable: true }), '8e5849f8ea27');

// ── 5. HÜBRIID ──────────────────────────────────────────────────────────
on('★★ üks tõde + ühesuunaline sünkroon -> lubatud',
   V.hybridOk({ sources: 1, syncOneWay: true }).ok, true);
on('★★ kaks algallikat -> EI',
   V.hybridOk({ sources: 2, syncOneWay: true }).ok, false);
on('★★ kahesuunaline sünkroon -> EI',
   V.hybridOk({ sources: 1, syncOneWay: false }).ok, false);
on('   ja põhjendus ütleb, MIKS',
   V.hybridOk({ sources: 2, syncOneWay: true }).reason.includes('lahku'), true);

on('★ migratsioonitee on viis sammu', V.MIGRATION_STEPS.length, 5);
on('★★ ja vana kustutatakse VIIMASENA',
   V.MIGRATION_STEPS[4].startsWith('kustuta vana'), true);
on('★ samm 4 jätab vana ALLES — kirjutamine lõpeb enne kustutamist',
   V.MIGRATION_STEPS[3].includes('lõpeta') && V.MIGRATION_STEPS[3].includes('ALLES'), true);

await clearMongo(db);
await client.close();
console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
