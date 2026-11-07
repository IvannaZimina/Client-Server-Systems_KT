// C05 Ex2 — ETTE ANTUD kombinaatorid. Seda faili sa EI kirjuta.
//
// ★ MIKS NEED SINULE ANTAKSE. Iga funktsioon siin on üks rida lubaduste
//   API-t, mille loeng 5 näitas läbi. Sinu töö on neid MÕÕTA ja SELETADA:
//   miks järjest võtab summa ja korraga maksimumi, mida allSettled päästab,
//   mida race EI tee.
import { delayedValue, delayedError } from './async-helpers.js';

// Järjest: iga await ootab eelmise ära.
export async function sequential(delays) {
  const rows = [];
  for (const ms of delays) rows.push(await delayedValue(ms, ms));
  return rows;
}

// Korraga: kõik tööd algavad kohe, Promise.all ootab kõiki.
export function parallel(delays) {
  return Promise.all(delays.map((ms) => delayedValue(ms, ms)));
}

// allSettled ei lükka kunagi tagasi; siin jagatakse tulemused kaheks.
export async function settleAll(promises) {
  const all = await Promise.allSettled(promises);
  return {
    fulfilled: all.filter((x) => x.status === 'fulfilled').map((x) => x.value),
    rejected: all.filter((x) => x.status === 'rejected').map((x) => x.reason.message),
  };
}

// Ajalõpp race-iga: esimene lõpetanu võidab, ka siis, kui ta lõpetas veaga.
export function withTimeout(promise, ms) {
  return Promise.race([promise, delayedError(`Ajalõpp ${ms} ms`, ms)]);
}
