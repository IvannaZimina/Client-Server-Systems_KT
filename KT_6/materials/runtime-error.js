// C06 Ex4 — ETTE ANTUD veaklassi alus. Seda faili sa EI kirjuta.
//
// Baasklass on andmekandja. Ex4 teema on TAKSONOOMIA — millised alamklassid
// on olemas, mis kood igaühele kuulub ja kuidas käsitleja neid eristab.
//
// ★ KAKS ERI VEALIIKI: käitusviga (oodatav — puuduv kirje, vigane sisend)
//   ja programmiviga (bug). Esimest käsitletakse, teise peale KÄIVITATAKSE
//   PROTSESS UUESTI: pärast püüdmata erindit on olek määramata.

export class RuntimeError extends Error {
  constructor(message, code = 500, detail = null) {
    super(message);
    this.name = 'RuntimeError';
    this.status = code;
    this.detail = detail;
    this.runtimeError = true;          // silt, mille järgi käsitleja otsustab
  }
}

export const isRuntimeError = (err) =>
  err instanceof RuntimeError && err.runtimeError === true;
