// C07 Ex1 — ETTE ANTUD teenuse viga ja tema tõlge HTTP-ks. Seda faili sa EI
// kirjuta: kopeeri ta server/ kausta ja ekspordi layers.js-ist edasi.
//
// ★ See on loengu 7 mehhanism: teenus ütleb vea LIIGI, HTTP-koodi valib
//   veakäsitleja, ja tabel liik -> kood on ÜHES kohas. Sinu töö on teenus ja
//   kontroller, mis selle peal töötavad.

// ★ Teenus viskab OMA vigu, mitte HTTP-koode. „404“ on HTTP mõiste; teenus
//   ütleb „ei leitud“ ja veakäsitleja tõlgib.
export class ServiceError extends Error {
  constructor(kind, message, detail = null) {
    super(message);
    this.name = 'ServiceError';
    // not_found | conflict | invalid | unauthenticated | forbidden
    this.kind = kind;
    this.detail = detail;
  }
}

export const KIND_TO_CODE = {
  not_found: 404,
  conflict: 409,
  invalid: 422,
  unauthenticated: 401,
  forbidden: 403,
};

// ★ AINUS KOHT, kus teenuse vea liik ja HTTP-kood kohtuvad. Tundmatu viga
//   (programmiviga) antakse EDASI keskse käsitlejani, mitte ei neelata alla.
export function serviceErrorHandler() {
  return (err, req, res, next) => {
    if (!(err instanceof ServiceError)) return next(err);
    return res.status(KIND_TO_CODE[err.kind] ?? 500).json({
      err: err.message,
      ...(err.detail ? { detail: err.detail } : {}),
    });
  };
}
