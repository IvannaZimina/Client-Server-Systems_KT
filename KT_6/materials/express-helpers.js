// C06 Ex3 — ETTE ANTUD Expressi abid. Seda faili sa EI kirjuta.
//
// Kaks tükki, mis on igas Expressi rakenduses sõna-sõnalt samad. Sinu töö on
// teada, KUHU nad ahelas kuuluvad — mitte neid uuesti kirjutada.

// ★ EXPRESS 4 EI PÜÜA async-käsitleja viga: `throw` async funktsioonis annab
//   püüdmata lubaduse ja päring jääb RIPPUMA. Express 5 püüab ise, aga see
//   mähis teeb kavatsuse NÄHTAVAKS ja töötab mõlemas versioonis.
export const wrap = (f) => (req, res, next) =>
  Promise.resolve(f(req, res, next)).catch(next);

// ★ 404-käsitleja peab olema KÕIGE VIIMANE marsruut. Kui ta on enne, püüab
//   ta kõik kinni ja ükski hilisem marsruut ei tööta.
export function notFound(req, res) {
  res.status(404).json({ err: 'Tundmatu tee', route: req.originalUrl });
}
