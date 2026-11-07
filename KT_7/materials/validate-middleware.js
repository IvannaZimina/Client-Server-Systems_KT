// C07 Ex4 — ETTE ANTUD valideerimise vahevara. Seda faili sa EI kirjuta:
// kopeeri ta server/ kausta ja ekspordi validate.js-ist edasi.
//
// ★ ASENDAB req.body PUHASTATUD väärtusega. Zod eemaldab tundmatud väljad ja
//   teisendab tüübid; kui seda tagasi ei kirjutata, kasutab marsruut ikka
//   TOORET sisendit ja kogu valideerimine on kaunistus.
//
// Vigane sisend -> 422 ja ühtne veakuju { err, code, fields } — sama kuju,
// mille sinu errorShape() annab.
import { zodFields } from './zod-fields.js';

export function validate(schema, from = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[from]);
    if (!result.success) {
      return res.status(422).json({
        err: 'Vigane sisend', code: 'INVALID_INPUT', fields: zodFields(result.error),
      });
    }
    if (from === 'query') req.request = result.data;   // req.query on Expressis kirjutuskaitstud
    else req[from] = result.data;
    return next();
  };
}
