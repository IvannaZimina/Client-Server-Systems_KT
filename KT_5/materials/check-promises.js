// C05 Ex2 — ETTE ANTUD proovijooks. Seda faili sa EI kirjuta.
//
// Iga kontroll ütleb ÜHE lause selle kohta, mida sinu funktsioon tegema peab.
//
//   node check-promises.js
import * as L from '../public/promises.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

// 1. viivitus
const t0 = Date.now();
await L.wait(60);
on('wait(60) võtab vähemalt 55 ms', Date.now() - t0 >= 55, true);
on('delayedValue annab väärtuse', await L.delayedValue('x', 5), 'x');
let thrown = null;
try { await L.delayedError('paha', 5); } catch (e) { thrown = e.message; }
on('delayedError viskab', thrown, 'paha');

// 2. ahel
const a = await L.chain(1);
on('ahela jälg', a.trace, ['sain sündmuse', 'lisasin hinna', 'finally']);
on('chain annab hinna', a.result.price, 24);
on('finally EI MUUDA väärtust', a.result.name, 'Sügiskontsert');

// 3. async/await annab sama kuju
const b = await L.chainWithAwait(1);
on('await annab sama hinna', b.result.price, 24);
on('await: finally jookseb', b.trace.includes('finally'), true);
on('async tagastab ALATI lubaduse', L.chainWithAwait(1) instanceof Promise, true);

// 4. järjest vs korraga — MÕÕDETUD
const v = [80, 80, 80];
const s1 = Date.now(); await L.sequential(v);   const sequentialMs = Date.now() - s1;
const s2 = Date.now(); await L.parallel(v);   const parallelMs = Date.now() - s2;
on('sequential võtab SUMMA (>=230 ms)', sequentialMs >= 230, true);
on('parallel võtab MAKSIMUMI (<150 ms)', parallelMs < 150, true);
on('parallel annab sama massiivi', await L.parallel([5, 6]), [5, 6]);
console.log(`   [mõõdetud] sequential ${sequentialMs} ms  ·  parallel ${parallelMs} ms`);

// 5. allSettled ja race
const k = await L.settleAll([
  L.delayedValue('seatmap', 5),
  L.delayedError('soodustused kukkusid', 5),
  L.delayedValue('prices', 5),
]);
on('settleAll: õnnestunud', k.fulfilled, ['seatmap', 'prices']);
on('settleAll: kukkunud', k.rejected, ['soodustused kukkusid']);
on('settleAll EI VISKA, kui üks kukub', Array.isArray(k.fulfilled), true);

let timeError = null;
try { await L.withTimeout(L.delayedValue('hilja', 200), 50); }
catch (e) { timeError = e.message; }
on('withTimeout viskab, kui liiga aeglane', timeError, 'Ajalõpp 50 ms');
on('withTimeout laseb kiire läbi', await L.withTimeout(L.delayedValue('kiire', 5), 100), 'kiire');

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
