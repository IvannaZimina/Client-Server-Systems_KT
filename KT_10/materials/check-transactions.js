// C10 Ex5 — ETTE ANTUD proovijooks.  node check-transactions.js
//
// ★★ SAMA KÜSIMUS MIS C09 Ex5: sada ostjat, üks koht. Teine andmebaas,
//    teine lahendus — ja see võrdlus ON ülesande mõte.
import { makeMongo, clearMongo, trialEvent, replicaSet } from './nosql.js';
import * as T from '../nosql/transactions.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 90000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`); process.exit(1);
}, WATCHDOG_MS);

const BUYERS = Number(process.env.BUYERS ?? 100);
const { client, db } = await makeMongo();
const set = await replicaSet(db);
console.log(`   replicaSet: ${set ?? 'EI OLE — tehingud ei tööta'}`);

const send = async () => {
  await clearMongo(db);
  await db.collection('events').insertOne(trialEvent(1));
};
const sold = async () => (await db.collection('events')
  .findOne({ _id: 's00001' })).seats.filter((k) => k.sold).length;
const counter = async () => (await db.collection('events')
  .findOne({ _id: 's00001' })).soldTotal;
const atOnce = (f) => Promise.allSettled(Array.from({ length: BUYERS }, () => f()));

// ── 1. VALE: loe, siis kirjuta ──────────────────────────────────────────
await send();
const wrong = await atOnce(() => T.buyWRONG(db,
  { eventId: 's00001', row: 1, number: 1, userId: 'k1' }));
const wrongSold = await sold();
const wrongCounter = await counter();
console.log(`   buyWRONG: ${wrongSold} kohta märgitud, loendur ${wrongCounter}, ` +
            `${wrong.filter((x) => x.value?.ok).length} vastust „ok“`);
on('★★ märgitud on ikkagi üks koht (rohkem ei saa — ta ON üks väli)', wrongSold, 1);
on('★★ AGA LOENDUR on üle loetud — mitu $inc jooksis läbi', wrongCounter > 1, true);
on('★★ ja mitu ostjat said vale vastuse „ok“',
   wrong.filter((x) => x.value?.ok).length > 1, true);

// ── 2. ÕIGE: tingimus on FILTRIS ────────────────────────────────────────
await send();
const right = await atOnce(() => T.buySeat(db,
  { eventId: 's00001', row: 1, number: 1, userId: 'k1' }));
const rightSold = await sold();
const rightCounter = await counter();
const succeeded = right.filter((x) => x.value?.ok).length;
const refused = right.filter((x) => x.value && !x.value.ok).length;
console.log(`   buySeat: ${rightSold} kohta, loendur ${rightCounter}, ` +
            `${succeeded} õnnestus, ${refused} keeldumist`);
on('★★ täpselt ÜKS koht müüdud', rightSold, 1);
on('★★ loendur on TÄPSELT ÜKS — ilma ühegi tehinguta', rightCounter, 1);
on('★★ täpselt üks ostja sai „ok“', succeeded, 1);
on('★★ ülejäänud said puhta ärilise vastuse', refused, BUYERS - 1);
on('★★ MITTE ÜKSKI ei visanud', right.filter((x) => x.status === 'rejected').length, 0);
on('keeldumise põhjus on inimkeelne',
   right.find((x) => x.value && !x.value.ok)?.value?.reason, 'koht on müüdud');

// ── 3. MITU DOKUMENTI: TEHING ───────────────────────────────────────────
if (set) {
  await send();
  const t = await T.buyInTwoPlaces(client, db,
    { eventId: 's00001', seats: [{ row: 1, number: 1 }, { row: 1, number: 2 }],
      userId: 'k1' });
  on('★ tehing õnnestus', t.ok, true);
  on('   ja märkis MÕLEMAD kohad', await sold(), 2);
  on('   ja lõi ostudokumendi', await db.collection('orders').countDocuments({}), 1);

  // ★ TEHING VEERETAB KÕIK TAGASI: teine koht on juba müüdud.
  const t2 = await T.buyInTwoPlaces(client, db,
    { eventId: 's00001', seats: [{ row: 2, number: 1 }, { row: 1, number: 2 }],
      userId: 'k2' });
  on('★★ osaliselt võimatu ost KEELDUB', t2.ok, false);
  on('★★ ja ESIMENE koht EI JÄÄNUD märgituks — kõik või mitte midagi',
     await sold(), 2);
  on('★★ ka ostudokument veeretati tagasi',
     await db.collection('orders').countDocuments({}), 1);
} else {
  broken.push('replikatsioonikomplekt puudub — tehingute osa JÄI KONTROLLIMATA');
}

// ── 4. PAKKTOIMING EI OLE TEHING ────────────────────────────────────────
await send();
await db.collection('events').insertOne(trialEvent(2));
const batch = await T.batchUpdate(db, [
  { id: 's00001', set: { name: 'Uus üks' } },
  { id: 's00002', set: { name: 'Uus kaks' } },
  { id: 'puudub', set: { name: 'Ei leia' } },
]);
on('kaks kolmest sobitus', batch.match, 2);
on('★ olematu id EI OLE viga — ta lihtsalt ei sobitu', batch.errors, 0);
on('★★ ja kaks esimest JÄID ALLES — pakil ei ole tagasiveeretust',
   (await db.collection('events').findOne({ _id: 's00001' })).name, 'Uus üks');
on('pakk ja tehing on eri asjad', T.BATCH_VS_TX.batch.rollback, 'EI OLE');

// ── 5. CAP JA LÕPPKOOSKÕLA ──────────────────────────────────────────────
on('★ P ei ole valik', T.CAP.P.includes('EI OLE valik'), true);
on('★ vabade kohtade arv EI TALU lõppkooskõla',
   T.allowsEventual({ what: 'free seats', lagOk: true }).allows, false);
on('   sest tema pealt tehakse OTSUS',
   T.allowsEventual({ what: 'free seats', lagOk: true }).reason.includes('OTSUS'), true);
on('vaatamiste loendur talub',
   T.allowsEventual({ what: 'views', lagOk: true }).allows, true);

await clearMongo(db);
await client.close();
console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
