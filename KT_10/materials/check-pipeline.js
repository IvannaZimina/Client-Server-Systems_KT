// C10 Ex3 — ETTE ANTUD proovijooks.  node check-pipeline.js
import { createHash } from 'node:crypto';
import { makeMongo, fillMongo, clearMongo, warmUp, clock } from './nosql.js';
import * as K from '../nosql/pipeline.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

// ★ Konveier või loendur: vastused on siin SÕRMEJÄLJENA, mitte kirjas: see fail
//   on sul käes, ja valik on sinu teha. Vale lahtri korral ütleb kontroll, MIS juhtum.
const fingerprint = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const cellOk = (label, key, value, expected) => {
  if (fingerprint(`${key}:${value}`) === expected) ok++;
  else broken.push(`${label} ${key}: ${JSON.stringify(value)} ei pea paika`);
};

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 90000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`); process.exit(1);
}, WATCHDOG_MS);

const { client, db } = await makeMongo();
const N = Number(process.env.ROWS ?? 2000);
await fillMongo(db, N);
await db.collection('events').createIndex({ 'venue.city': 1 });
await warmUp(db);

// ── 1. KOOND ────────────────────────────────────────────────────────────
const summary = await db.collection('events').aggregate(K.citySummary()).toArray();
on('★ rühmi on nii palju, kui on eri linnu', summary.length, 4);
on('★ rühma võti on ümber nimetatud — kliendini ei jõua `_id`',
   [summary[0]._id, typeof summary[0].city], [undefined, 'string']);
on('kõik sündmused said rühma', summary.reduce((s, r) => s + r.eventCount, 0), N);
on('keskmine hind on ümardatud kahe kohani',
   String(summary[0].avgPrice).split('.')[1]?.length <= 2, true);
on('järjestus on kahanev sündmuste arvu järgi',
   summary.every((r, i) => i === 0 || summary[i - 1].eventCount >= r.eventCount), true);

// ── 2. ★ ETAPPIDE JÄRJEKORD: SAMA TULEMUS, ERI HIND ─────────────────────
const bad = await clock(() => db.collection('events').aggregate(K.BAD_ORDER).toArray());
const good = await clock(() => db.collection('events').aggregate(K.GOOD_ORDER).toArray());
on('★★ mõlemad annavad SAMA vastuse', bad.result[0].eventCount, good.result[0].eventCount);

// ★ Koondamise `explain` on PESASTATUD teisiti kui `find` oma: arvud
//   peituvad `stages[0].$cursor.executionStats` sees. Selle asemel et
//   mäletada kuju peast, otsime välja nime järgi kogu puust.
const findField = (o, name, col = []) => {
  if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) {
      if (k === name && typeof v === 'number') col.push(v);
      else findField(v, name, col);
    }
  }
  return col;
};
const examined = async (pipeline) => {
  const s = await db.collection('events').aggregate(pipeline)
    .explain('executionStats');
  const numbers = findField(s, 'totalDocsExamined');
  return numbers.length ? Math.max(...numbers) : null;
};
const keys = async (pipeline) => {
  const s = await db.collection('events').aggregate(pipeline).explain('executionStats');
  const a = findField(s, 'totalKeysExamined');
  return a.length ? Math.max(...a) : 0;
};
const badV = await examined(K.BAD_ORDER);
const goodV = await examined(K.GOOD_ORDER);
const badKeys = await keys(K.BAD_ORDER);
console.log(`   $group enne $match: ${bad.ms} ms, `
            + `${badV} dokumenti / ${badKeys} indeksivõtit`);
const goodKeys = await keys(K.GOOD_ORDER);
console.log(`   $match enne $group: ${good.ms} ms, `
            + `${goodV} dokumenti / ${goodKeys} indeksivõtit`);
// ★ HEA VARIANT EI PUUTU ÜHTKI DOKUMENTI. Filter klapib indeksiga ja
//   rühmitamiseks vajalik väli ON indeksis — seega kettalt ei loeta midagi.
//   Halb variant peab kõik 2000 dokumenti läbi lugema, et neid rühmitada,
//   ja alles siis viskab 3/4 ära.
on('★★ hea järjekord vaatab VÄHEM dokumente', goodV < badV, true);
on('★★ ja tema puhul on see NULL — kaetud indeksi skaneering', goodV, 0);

on('★ filter esimesena on OK', K.filterIsFirst(K.GOOD_ORDER).ok, true);
on('★ filter pärast rühmitamist EI OLE', K.filterIsFirst(K.BAD_ORDER).ok, false);
on('   ja põhjendus nimetab etapi numbri',
   K.filterIsFirst(K.BAD_ORDER).reason.includes('2.'), true);
on('filtrita konveier ei ole viga', K.filterIsFirst([{ $sort: { _id: 1 } }]).ok, true);
on('etappide nimed tulevad järjekorras',
   K.stageNames(K.GOOD_ORDER), ['$match', '$group']);

// ── 3. $lookup ON JOIN ──────────────────────────────────────────────────
// Paneme igale kümnendale sündmusele ühe pileti.
const events = await db.collection('events').find({}).project({ _id: 1 })
  .limit(N).toArray();
const tickets = events.filter((_, i) => i % 10 === 0)
  .map((s, i) => ({ _id: `p${i}`, eventId: s._id }));
await db.collection('tickets').insertMany(tickets, { ordered: false });
await db.collection('tickets').createIndex({ eventId: 1 });

const orders = await clock(() => db.collection('events')
  .aggregate(K.orderSummary()).limit(20).toArray());
console.log(`   $lookup ${N} dokumendi peale: ${orders.ms} ms`);
on('$lookup annab loenduri', typeof orders.result[0].sold, 'number');
on('★ vabu = kohti - müüdud', orders.result[0].free,
   orders.result[0].seatCount - orders.result[0].sold);
on('★ piletimassiiv on projektsiooniga MAHA VÕETUD', orders.result[0].tickets, undefined);
on('kokku müüdud klapib sisestatuga',
   (await db.collection('events').aggregate(K.orderSummary()).toArray())
     .reduce((s, r) => s + r.sold, 0), tickets.length);

cellOk('★ koondi viis', 'instantManyReads',
       K.adviseSummary({ timesPerDay: 5000, accuracyNeed: 'instant' }), '2c27e06ffbe8');
cellOk('koondi viis', 'dailyReport',
       K.adviseSummary({ timesPerDay: 1, accuracyNeed: 'report' }), '66e7095a2a20');

// ── 4. KURSOR, MITTE MASSIIV ────────────────────────────────────────────
let n = 0;
const rows = await K.aggregateAsStream(db, [{ $match: {} }, { $project: { _id: 1 } }],
                                   () => { n += 1; });
on('★ voona lugemine käib KÕIK dokumendid läbi', [rows, n], [N, N]);
on('piirid on kirjas', Object.keys(K.LIMITS).sort(), ['document', 'result', 'stage']);

await clearMongo(db);
await client.close();
console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
