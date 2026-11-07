// C05 Ex2 — ETTE ANTUD asünkroonsed abid. Seda faili sa EI kirjuta.
//
// Kolm ühesugust mähist tagasikutse ümber. Nad on siin, sest `new Promise`
// mähkimine on MUSTER, mille teed läbi ÜKS kord — Ex2 teema on ahelad,
// async/await ja mitme päringu koos ootamine, mitte mähkimine.
//
// ★ new Promise on vaja AINULT siis, kui mähid tagasikutsega API-t.
//   Kui sul on juba lubadus, ÄRA mähi teda teise lubadusse.

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function delayedValue(value, ms) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function delayedError(message, ms) {
  return new Promise((_, rejectLater) =>
    setTimeout(() => rejectLater(new Error(message)), ms));
}
