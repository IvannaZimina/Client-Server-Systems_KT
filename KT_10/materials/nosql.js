// C10 — ETTE ANTUD. Ühendused ja proovi-andmed. Seda sa EI kirjuta.
//
// ★ SIIN ON KAKS ANDMEBAASI, sest loeng räägib kahest. Kumbki käivitub ühe
//   käsuga ja kumbki jookseb sinu masinas — pilve kontot EI OLE VAJA.
//
// ── MongoDB ────────────────────────────────────────────────────────────
//   docker run -d --name piletikassa-mongo -p 27019:27019 mongo:8 \
//        --replSet rs0 --bind_ip_all --port 27019
//   docker exec piletikassa-mongo mongosh --port 27019 \
//        --eval 'rs.initiate({_id:"rs0", members:[{_id:0, host:"127.0.0.1:27019"}]})'
//
// ★ MIKS `--replSet`, KUI ME AINULT ÜHTE SÕLME KASUTAME? Sest TEHINGUD
//   (Ex5) ei tööta üksiku `mongod` peal. Ühe sõlmega komplekt on täiesti
//   tavaline arenduses ja annab sulle tehingud kohe.
//
// ★ PORT ON 27019, mitte 27017 — sama põhjus, mis pani MySQL-i 3309 peale.
//
// ── Firestore (emulaator) ──────────────────────────────────────────────
//   npx firebase emulators:start --only firestore --project piletikassa-demo
//
// ★ EMULAATOR EI VAJA GOOGLE'I KONTOT ega interneti. Ta vajab Javat.
import { MongoClient } from 'mongodb';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const MONGO_URL = process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27019';
export const MONGO_DB = process.env.MONGO_DB ?? 'piletikassa';
export const FS_HOST = process.env.FIRESTORE_HOST ?? '127.0.0.1';
export const FS_PORT = Number(process.env.FIRESTORE_PORT ?? 8085);

export async function makeMongo() {
  const client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 3000 });
  await client.connect();
  return { client, db: client.db(MONGO_DB) };
}

/** Kas paigaldus toetab tehinguid? Ex5 küsib seda ja RAPORTEERIB vastuse. */
export async function replicaSet(db) {
  const info = await db.admin().command({ hello: 1 });
  return info.setName ?? null;
}

// ★ EMULAATORI AADRESS ANTAKSE KESKKONNAMUUTUJAGA, mitte koodis —
//   nii ei saa tootmises kogemata emulaatorisse kirjutada ega vastupidi.
process.env.FIRESTORE_EMULATOR_HOST ??= `${FS_HOST}:${FS_PORT}`;

let fsApp = null;
export function makeFirestore(name = 'trial') {
  fsApp = initializeApp({ projectId: 'piletikassa-demo' }, name + '-' + Date.now());
  return getFirestore(fsApp);
}
export async function closeFirestore() {
  if (fsApp) { await deleteApp(fsApp); fsApp = null; }
}

// ── PROOVIANDMED ────────────────────────────────────────────────────────
// ★ SAMA PILETIKASSA MIS C09-s, aga dokumendikujul. Võrdlus on tahtlik:
//   sa näed, mis SAMAKS jääb ja mis muutub.
export const CITIES = ['Tartu', 'Tallinn', 'Pärnu', 'Viljandi'];

export function trialEvent(i) {
  const city = CITIES[i % CITIES.length];
  const rows = 3, cols = 4;
  const seats = [];
  for (let row = 1; row <= rows; row += 1) {
    for (let number = 1; number <= cols; number += 1) seats.push({ row, number, sold: false });
  }
  return {
    _id: `s${String(i).padStart(5, '0')}`,
    name: `Proovisündmus ${String(i).padStart(5, '0')}`,
    startsAt: new Date(Date.UTC(2026, i % 12, 15, 19, 0, 0)),
    price: (i % 90) + 10,
    seatCount: seats.length,
    soldTotal: 0,
    venue: { name: `Saal ${city}`, city },
    seats,
  };
}

export async function fillMongo(db, n = 2000) {
  await clearMongo(db);
  const batch = Array.from({ length: n }, (_, i) => trialEvent(i));
  await db.collection('events').insertMany(batch, { ordered: false });
  return n;
}

// ★★ INDEKSID TULEB KA MAHA VÕTTA, MITTE AINULT DOKUMENDID. MÕÕDETUD:
//    check-pipeline.js lisas indeksi `venue.city`, see jäi alles, ja
//    järgmine check-mongo.js luges indekseid 5, kui ootas 4. Kaks jooksu
//    ANDSID ERI TULEMUSE — sama viga, mis C09-s jättis baasi 39 992 kohta.
export async function clearMongo(db) {
  for (const k of ['events', 'tickets', 'orders', 'trial']) {
    await db.collection(k).deleteMany({});
    try { await db.collection(k).dropIndexes(); } catch { /* kollektsiooni ei ole */ }
  }
}

// ★ EMULAATORI TÜHJENDAMINE käib REST-i kaudu — kollektsioonide kaupa
//   kustutamine oleks aeglane ja jätaks alamkollektsioonid alles.
export async function clearFirestore() {
  const url = `http://${FS_HOST}:${FS_PORT}`
              + '/emulator/v1/projects/piletikassa-demo/databases/(default)/documents';
  const v = await fetch(url, { method: 'DELETE' });
  if (!v.ok) throw new Error(`emulaatori tühjendamine kukkus: ${v.status}`);
}

export const clock = async (f) => {
  const t0 = performance.now();
  const result = await f();
  return { ms: Math.round(performance.now() - t0), result };
};

export async function warmUp(db, times = 5) {
  for (let i = 0; i < times; i += 1) await db.command({ ping: 1 });
}
