// C10 Ex4 — ETTE ANTUD proovijooks.  node check-firestore.js
//
// ★ VAJAB EMULAATORIT:
//     npx firebase emulators:start --only firestore --project piletikassa-demo
import { makeFirestore, closeFirestore, clearFirestore, clock } from './nosql.js';
import * as F from '../nosql/firestore.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 90000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s — kas emulaator töötab?`);
  process.exit(1);
}, WATCHDOG_MS);

// ── 1. TEE VAHELDUB: kollektsioon / dokument / kollektsioon ─────────────
const segments = (path) => path.split('/').length;
on('kollektsioon = paaritu arv segmente', segments(F.PATHS.events) % 2, 1);
on('dokument = paaris arv', segments('events/s1') % 2, 0);
on('★ alamkollektsioon on jälle paaritu', segments(F.PATHS.seats('s1')) % 2, 1);
on('★ tuletatud id-st saab dokumendi ilma päringuta',
   F.PATHS.seat('s1', 3, 4), 'events/s1/seats/r3n4');
on('seatId on tuletatav, mitte juhuslik', F.seatId(3, 4), 'r3n4');
on('★ Firestore dokumendilagi on 1 MB — kümme korda väiksem kui Mongol',
   F.DOC_LIMIT, 1024 * 1024);

// ── 2. INDEKSINÕUE ──────────────────────────────────────────────────────
const i1 = F.neededIndex({ collection: 'events', equalities: ['venue.city'],
                             order: ['startsAt'] });
on('★ kaks välja -> KOMPOSIITindeks', i1.composite, true);
on('★ ja veergude järjekord on määratud: võrdus enne järjestust',
   i1.fields, ['venue.city', 'startsAt']);
on('üks väli -> automaatne indeks, komposiitne ei ole vaja',
   F.neededIndex({ collection: 'events', order: ['startsAt'] }).composite, false);
on('★ sama väli võrduses ja järjestuses ei kordu',
   F.neededIndex({ collection: 's', equalities: ['a'], order: ['a'] }).fields, ['a']);
on('★ võrratus tuleb võrduse JA järjestuse vahele',
   F.neededIndex({ collection: 's', equalities: ['city'], inequalities: ['price'],
                     order: ['startsAt'] }).fields, ['city', 'price', 'startsAt']);
on('★ nimekiri sellest, mida Firestore EI OSKA, on olemas', F.CANNOT_DO.length >= 5, true);
on('   ja JOIN on selles nimekirjas', F.CANNOT_DO.some((x) => x.startsWith('JOIN')), true);

// ── 3. PÄRIS EMULAATOR ──────────────────────────────────────────────────
await clearFirestore();
const db = makeFirestore();

const EVENT = 's1';
await F.makeEvent(db, EVENT, {
  name: 'Sügiskontsert', startsAt: new Date('2026-10-04T19:00:00Z'), price: 24,
  venue: { name: 'Vanemuine', city: 'Tartu' },
});
const seatPaths = await F.makeSeats(db, EVENT, 3, 4);
on('★ 12 kohta läksid ALAMKOLLEKTSIOONI', seatPaths.length, 12);

const s = await F.readEvent(db, EVENT);
on('sündmus tuleb tagasi', s.name, 'Sügiskontsert');
on('★★ ja tema alamkollektsioon EI TULNUD kaasa', s.seats, undefined);
on('★ selle jaoks on eraldi lugemine',
   (await F.readAll(db.collection(F.PATHS.seats(EVENT)))).length, 12);
on('★ olematu dokument -> null, mitte viga', await F.readEvent(db, 'ei-ole'), null);

// ★ `update` puuduva dokumendi peal KUKUB — ja see on siin õige.
const missing = await F.markSold(db, EVENT, 9, 9, 'k1')
  .then(() => 'passed', () => 'failed');
on('★★ olematu koha märkimine KUKUB (update ei loo dokumenti)', missing, 'failed');

// ── 4. ★ KUULAJA: esimene teade tuleb KOHE ja ta on TÄISSEIS ────────────
const notices = [];
const stop = F.watchFreeSeats(db, EVENT, {
  onChange: (t) => notices.push(t),
  err: (e) => broken.push('kuulaja viga: ' + e.message),
});
await new Promise((r) => setTimeout(r, 700));
on('★★ kuulaja sai teate ILMA ühegi muutuseta', notices.length >= 1, true);
on('★★ ja esimene teade on TÄISSEIS, mitte muutus', notices[0].free, 12);
on('   esimeses teates on kõik 12 „added“',
   notices[0].changes.filter((m) => m.kind === 'added').length, 12);

const before = notices.length;
await F.markSold(db, EVENT, 1, 1, 'k1');
await new Promise((r) => setTimeout(r, 700));
on('★ muutus tõi uue teate', notices.length > before, true);
const last = notices[notices.length - 1];
on('★ ja vabu on nüüd 11', last.free, 11);
on('★★ docChanges ütleb, MIS muutus — mitte „midagi muutus“',
   last.changes.some((m) => m.kind === 'removed' && m.id === 'r1n1'), true);
stop();
console.log(`   kuulaja sai ${notices.length} teadet: esimene täisseis, ülejäänud muutused`);

// ── 5. KOLLEKTSIOONIRÜHM ────────────────────────────────────────────────
await F.makeEvent(db, 's2', { name: 'Teine', startsAt: new Date('2026-11-01'), price: 10,
                               venue: { name: 'Saal', city: 'Tallinn' } });
await F.makeSeats(db, 's2', 2, 2);
const group = await F.readAll(F.allFreeSeats(db, { per: 50 }));
on('★★ kollektsioonirühm näeb KÕIGI sündmuste kohti', group.length, 11 + 4);

// ── 6. MIDA EMULAATOR EI JÕUSTA ─────────────────────────────────────────
// ★★ SEE ON HOIATUS, MITTE KONTROLL. Emulaator loob komposiitindeksid ISE;
//    tootmine EI LOO.
const composite = await clock(() => F.readAll(
  db.collection(F.PATHS.events).where('venue.city', '==', 'Tartu')
    .orderBy('startsAt').limit(5)));
console.log(`   komposiitindeksit nõudev päring: ${composite.ms} ms, ` +
            `${composite.result.length} dokumenti — EMULAATOR EI NÕUDNUD indeksit`);
on('★★ emulaatoris läheb see läbi (tootmises nõuab indeksit)',
   composite.result.length >= 1, true);
on('★ seepärast on indeksid koodis kirjas, mitte avastamise ootel',
   F.INDEXES.length >= 2, true);

// ★★ VANA REEGEL, MIDA ENAM EI OLE.
const oldRule = await db.collection(F.PATHS.events)
  .where('price', '>', 10).orderBy('startsAt').get()
  .then((x) => x.size, (e) => e.message);
console.log('   võrratus + teise välja orderBy -> ' +
            (typeof oldRule === 'number' ? 'LÄKS LÄBI' : 'VIGA'));
on('★★ see vana reegel EI KEHTI enam — päring töötab', typeof oldRule, 'number');

const two = await db.collection(F.PATHS.events)
  .where('price', '>', 10).where('startsAt', '>', new Date('2020-01-01')).get()
  .then((x) => x.size, (e) => e.message);
console.log('   kaks võrratust eri väljadel -> ' +
            (typeof two === 'number' ? two + ' doc' : 'VIGA'));
on('★★ ka „ainult üks võrratusväli“ on aegunud', typeof two, 'number');

// ── 7. KURSOR ON DOKUMENT, MITTE ARV ────────────────────────────────────
const page1 = await db.collection(F.PATHS.events).orderBy('startsAt').limit(1).get();
const page2 = await db.collection(F.PATHS.events).orderBy('startsAt')
  .startAfter(page1.docs[0]).limit(1).get();
on('★★ kursor viib indeksis otse kohale — teine lehekülg on ERI dokument',
   page1.docs[0].id === page2.docs[0]?.id, false);

await clearFirestore();
await closeFirestore();
console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
