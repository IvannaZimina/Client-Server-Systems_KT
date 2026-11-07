// C05 Ex3 — ETTE ANTUD proovijooks.  node check-request.js
import * as P from '../public/request.js';
import { fakeFetch, FakeResponse } from './fake-fetch.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

// 1. readResponse
on('200 annab keha', await P.readResponse(new FakeResponse({ status: 200, body: [1, 2] })), [1, 2]);
let v = null;
try { await P.readResponse(new FakeResponse({ status: 404, body: { err: 'Ei ole' } })); }
catch (e) { v = { message: e.message, kind: e.kind, status: e.status }; }
on('404 viskab kliendiveaga', v, { message: 'Ei ole', kind: 'client', status: 404 });

v = null;
try { await P.readResponse(new FakeResponse({ status: 500, body: { err: 'DB' } })); }
catch (e) { v = e.kind; }
on('500 on serveriviga', v, 'server');

v = null;
try { await P.readResponse(new FakeResponse({ status: 429, body: { err: 'Liiga palju' } })); }
catch (e) { v = e.kind; }
on('429 on serveri laad (korratav), mitte kliendiviga', v, 'server');

// ★ 200 OK JA katkine JSON — kaks eri viga ühe päringu sees
v = null;
try { await P.readResponse(new FakeResponse({ status: 200, text: '{broken' })); }
catch (e) { v = e.kind; }
on('200 + katkine JSON -> vormingu viga', v, 'format');

// 2. viga -> olek
on('võrguviga', P.errorToState(new TypeError('Failed to fetch')).message,
   'Ühendus puudub. Kontrolli võrku.');
on('serveriviga', P.errorToState({ kind: 'server' }).state, 'err');
on('vormingu viga', P.errorToState({ kind: 'format' }).message, 'Server saatis vigase vastuse.');

// 3. olekumasin — TÜHI EI OLE VIGA
on('data', P.stateFromData([{ id: 1 }]).state, 'data');
on('tühi massiiv -> state empty', P.stateFromData([]).state, 'empty');
on('tühi EI OLE viga', P.stateFromData([]).state === 'err', false);
on('tühjal on oma teade', P.stateFromData([]).message, 'Ükski sündmus ei vasta otsingule.');
on('mitte-massiiv -> viga', P.stateFromData({ a: 1 }).state, 'err');

// 4. klient: neli olekut läbi
const f1 = fakeFetch([{ status: 200, body: [{ id: 1 }] }]);
on('client annab data', (await P.createClient({ fetchFn: f1 }).events()).state, 'data');
const f2 = fakeFetch([{ status: 200, body: [] }]);
on('client annab tühja', (await P.createClient({ fetchFn: f2 }).events()).state, 'empty');
const f3 = fakeFetch([{ status: 500, body: { err: 'DB' } }]);
on('client annab vea', (await P.createClient({ fetchFn: f3 }).events()).state, 'err');
const f4 = fakeFetch([{ networkError: true }]);
on('networkError ei kuku läbi', (await P.createClient({ fetchFn: f4 }).events()).state, 'err');

// 5. topeltsaatmise vältimine — MÕÕDETUD
const f5 = fakeFetch([{ delay: 40, status: 200, body: [{ id: 1 }] }]);
const k = P.createClient({ fetchFn: f5 });
const [a, b] = await Promise.all([k.events(), k.events()]);
on('kaks korraga -> ÜKS päring', f5.calls.length, 1);
on('mõlemad saavad tulemuse', [a.state, b.state], ['data', 'data']);
on('järjekord tühjeneb', k.inFlightCount(), 0);

// pärast lõpetamist tehakse UUS päring
const f6 = fakeFetch([{ status: 200, body: [] }, { status: 200, body: [] }]);
const k6 = P.createClient({ fetchFn: f6 });
await k6.events(); await k6.events();
on('järjest -> KAKS päringut', f6.calls.length, 2);

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
