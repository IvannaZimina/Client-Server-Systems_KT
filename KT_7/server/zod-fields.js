// C07 Ex4 — ETTE ANTUD Zodi vea teisendus. Seda faili sa EI kirjuta:
// kopeeri ta server/ kausta ja ekspordi validate.js-ist edasi.
//
// Zodi viga -> väljapõhine kuju { väli: teade }. KÕIK vead korraga, mitte
// esimene: kasutaja ei tohi parandada nelja välja neljas eri saatmises.
export function zodFields(err) {
  const fields = {};
  for (const p of err.issues) {
    // Pesastatud tee ['address', 'city'] -> 'address.city'.
    const route = p.path.join('.') || '_';
    if (!fields[route]) fields[route] = p.message;
  }
  return fields;
}
