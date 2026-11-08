// C10 — ETTE ANTUD seadete lugeja ja klient. Seda faili sa ei kirjuta.
//
// ★ MIKS SEE SINULE ANTAKSE. Sama funktsiooni kirjutasid sa juba C06 Ex2-s
//   ja tema õpetus — „puuduv seade KUKUTAB käivituse, mitte esimese
//   päringu“ — on seal juba õpitud. Teist korda sama filtri kirjutamine ei
//   lisa midagi; siin on töö SKEEM, FILTER JA PLAAN.
//
// ★ KÄIVITUSEL, MITTE HILJEM. Puuduv seade avastatakse muidu alles
//   tootmises, kolm tundi pärast juurutamist — ja siis on ta juba
//   kasutaja probleem, mitte sinu oma.

import { MongoClient } from 'mongodb';

export function readSettings(env = process.env) {
  const missing = ['MONGO_URL', 'MONGO_DB'].filter((n) => !env[n]);
  if (missing.length) throw new Error(`Puuduvad keskkonnamuutujad: ${missing.join(', ')}`);
  return { url: env.MONGO_URL, db: env.MONGO_DB };
}

// ★ MongoClient ON kogum (loeng 10): ta luuakse ÜKS kord protsessi kohta.
//   maxPoolSize on vaikimisi 100; ootepiir on vaikimisi 30 s.
export function makeClient(settings, { size = 10 } = {}) {
  return new MongoClient(settings.url, {
    maxPoolSize: size,
    serverSelectionTimeoutMS: 3000,
  });
}
