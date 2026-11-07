// C05 Ex4 — ETTE ANTUD proovijooks.  node check-abort.js
import * as K from '../public/abort.js';
import { fakeFetch, FakeResponse } from './fake-fetch.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);
const now = async () => {};        // ei oota päris aega -> testid on kiired

// 1. kasvav ooteaeg
on('1. katse = alus', K.waitTime(1), 200);
on('2. katse = 2x', K.waitTime(2), 400);
on('3. katse = 4x', K.waitTime(3), 800);
on('lagi peab kehtima', K.waitTime(9, { cap: 5000 }), 5000);
on('jitter jääb vahemikku', K.waitTime(1, { jitter: 100 }) <= 300, true);

// 2. mida tohib korrata
on('500 -> korda', K.shouldRetry(new FakeResponse({ status: 500 }), null), true);
on('503 -> korda', K.shouldRetry(new FakeResponse({ status: 503 }), null), true);
on('429 -> korda', K.shouldRetry(new FakeResponse({ status: 429 }), null), true);
on('404 -> ÄRA korda', K.shouldRetry(new FakeResponse({ status: 404 }), null), false);
on('422 -> ÄRA korda', K.shouldRetry(new FakeResponse({ status: 422 }), null), false);
on('200 -> ÄRA korda', K.shouldRetry(new FakeResponse({ status: 200 }), null), false);
on('võrguviga -> korda', K.shouldRetry(null, new TypeError('Failed to fetch')), true);
const ab = new Error('x'); ab.name = 'AbortError';
on('AbortError -> ÄRA korda', K.shouldRetry(null, ab), false);
// meetod: korrata tohib ainult idempotentset päringut (C04 Ex2)
on('POST 503 -> ÄRA korda', K.shouldRetry(new FakeResponse({ status: 503 }), null, 'POST'), false);
on('PATCH võrguviga -> ÄRA korda',
   K.shouldRetry(null, new TypeError('Failed to fetch'), 'PATCH'), false);
on('PUT 503 -> korda', K.shouldRetry(new FakeResponse({ status: 503 }), null, 'PUT'), true);
on('DELETE võrguviga -> korda',
   K.shouldRetry(null, new TypeError('Failed to fetch'), 'DELETE'), true);

// 3. Retry-After
on('Retry-After sekundites',
   K.serverWait(new FakeResponse({ headers: { 'Retry-After': '3' } })), 3000);
on('Retry-After puudub', K.serverWait(new FakeResponse({})), null);

// 4. kogu loogika
const f1 = fakeFetch([{ status: 503 }, { status: 503 }, { status: 200, body: [] }]);
const r1 = await K.requestWithRetry('/api/events', { fetchFn: f1, wait: now });
on('kolmas katse õnnestub', r1.response.status, 200);
on('tehti TÄPSELT 3 päringut', f1.calls.length, 3);
on('katseid raporteeritakse', r1.attempts, 3);

const f2 = fakeFetch([{ status: 404 }]);
const r2 = await K.requestWithRetry('/api/events/99', { fetchFn: f2, wait: now });
on('404 EI korrata', f2.calls.length, 1);
on('404 tuleb tagasi vastusena', r2.response.status, 404);

const f3 = fakeFetch([{ networkError: true }, { networkError: true }, { networkError: true }]);
let v3 = null;
try { await K.requestWithRetry('/x', { fetchFn: f3, attempts: 3, wait: now }); }
catch (e) { v3 = e.constructor.name; }
on('kõik katsed kukuvad -> viskab', v3, 'TypeError');
on('proovis 3 korda', f3.calls.length, 3);

// ★ POST-i ei korrata: korratud ost on teine ost
const f7 = fakeFetch([{ status: 503 }, { status: 201, body: {} }]);
const r7 = await K.requestWithRetry('/api/orders',
  { fetchFn: f7, method: 'POST', wait: now });
on('POST 503 EI korrata', f7.calls.length, 1);
on('POST 503 tuleb tagasi vastusena', r7.response.status, 503);
const f8 = fakeFetch([{ networkError: true }, { status: 201, body: {} }]);
let v8 = null;
try { await K.requestWithRetry('/api/orders', { fetchFn: f8, method: 'POST', wait: now }); }
catch (e) { v8 = e.constructor.name; }
on('POST võrguviga viskab kohe', v8, 'TypeError');
on('POST võrguviga EI korrata', f8.calls.length, 1);

// 5. kasutaja katkestus EI OLE tõrge
const controller = new AbortController();
const f4 = fakeFetch([{ delay: 30, status: 200 }]);
setTimeout(() => controller.abort(), 5);           // ilma põhjuseta
let v4 = null;
try { await K.requestWithRetry('/x', { fetchFn: f4, signal: controller.signal, wait: now }); }
catch (e) { v4 = e.name; }
on('abort() ilma põhjuseta viskab AbortErrori', v4, 'AbortError');
on('katkestust EI KORRATA', f4.calls.length, 1);

// 6. ajalõpp katkestab päringu — ja teda KORRATAKSE, sest server võib
//    järgmisel korral jõuda
const f5 = fakeFetch([{ delay: 200, status: 200 }]);
let v5 = null;
try { await K.requestWithRetry('/x', { fetchFn: f5, timeout: 30, attempts: 2, wait: now }); }
catch (e) { v5 = e.name; }
on('ajalõpp katkestab TimeoutErroriga', v5, 'TimeoutError');
on('ajalõppu korratakse', f5.calls.length, 2);

// 7. kasutaja katkestas JA see katse kukkus võrguveaga -> EI TOHI korrata.
//    Ilma välise signaali kontrollita korraks kood edasi, kuigi kasutaja
//    on juba lahkunud. Just see juht eristab kontrolli redundantsest reast.
const case2 = new AbortController();
const f6 = fakeFetch([{ networkError: true }, { status: 200, body: [] }]);
case2.abort(new Error('kasutaja lahkus lehelt'));
let v6 = null;
try { await K.requestWithRetry('/x', { fetchFn: f6, signal: case2.signal, wait: now }); }
catch (e) { v6 = e.constructor.name; }
on('katkestatuna EI proovita teist korda', f6.calls.length, 1);
on('viga tuleb välja', v6 !== null, true);

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
