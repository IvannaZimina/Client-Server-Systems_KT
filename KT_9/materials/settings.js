// C09 — ETTE ANTUD seadete lugeja. Seda faili sa ei kirjuta.
//
// ★ MIKS SEE SINULE ANTAKSE. Sama funktsiooni kirjutasid sa juba C06 Ex2-s
//   ja tema õpetus — „puuduv seade KUKUTAB käivituse, mitte esimese
//   päringu“ — on seal juba õpitud. Teist korda sama filtri kirjutamine ei
//   lisa midagi; siin on töö ÜHENDUSTE KOGUM.
//
// ★ KÄIVITUSEL, MITTE HILJEM. Puuduv seade avastatakse muidu alles
//   tootmises, kolm tundi pärast juurutamist — ja siis on ta juba
//   kasutaja probleem, mitte sinu oma.

export function readSettings(env = process.env) {
  const missing = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
    .filter((n) => !env[n]);
  if (missing.length) throw new Error(`Puuduvad keskkonnamuutujad: ${missing.join(', ')}`);
  return {
    host: env.DB_HOST,
    port: Number(env.DB_PORT ?? 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  };
}
