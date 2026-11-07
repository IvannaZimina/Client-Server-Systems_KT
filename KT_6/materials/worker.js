// C06 Ex6 — ETTE ANTUD töölõim. Seda faili sa EI kirjuta.
//
// ★ Töölõim on OMA V8 eksemplar: oma mälu, oma sündmuste tsükkel. Ta EI
//   jaga muutujaid peamise lõimega — andmed liiguvad sõnumitega (või
//   SharedArrayBuffer'iga). Just see teebki ta ohutuks.
import { parentPort, workerData } from 'node:worker_threads';

let s = 0;
for (let i = 0; i < workerData.times; i += 1) s += Math.sqrt(i) % 7;
parentPort.postMessage(Math.round(s));
