// C05 Ex5 — ETTE ANTUD proovijooks.  node check-api.js
import { createHash } from 'node:crypto';
import { makeApi, ApiError, toEvent, renderMode, RENDER_MODES }
  from '../public/api.js';
import { fakeFetch } from './fake-fetch.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

const RAW = { id: 1, name: 'Sügiskontsert', venue: 'Vanemuine',
                 start: '2026-10-04T19:00', seats: 420, sold: 118, price: 24 };

// 1. teisendus piiril
const s = toEvent(RAW);
on('start on Date, mitte sõne', s.start instanceof Date, true);
on('free on ARVUTATUD', s.free, 302);
on('soldOut false', s.soldOut, false);
on('soldOut true, kui täis',
   toEvent({ ...RAW, sold: 420 }).soldOut, true);

// 2. üks viga-tüüp
const network = new ApiError('x', { kind: 'network' });
const server = new ApiError('x', { kind: 'server' });
const client = new ApiError('Ei ole', { kind: 'client', status: 404 });
const aborted = new ApiError('x', { kind: 'abort' });
on('võrguviga on korratav', network.repeatable, true);
on('serveriviga on korratav', server.repeatable, true);
on('kliendiviga EI OLE korratav', client.repeatable, false);
on('katkestust EI NÄIDATA', aborted.forUser, null);
on('kliendiviga näitab oma teadet', client.forUser, 'Ei ole');
on('võrguviga on inimkeelne', network.forUser, 'Ühendus puudub. Kontrolli võrku.');

// 3. iga viga tuleb ApiError-ina
const attempt = async (plan) => {
  try { await makeApi({ fetchFn: fakeFetch(plan) }).events(); return null; }
  catch (e) { return { cls: e.constructor.name, kind: e.kind }; }
};
on('500 -> ApiError(server)', await attempt([{ status: 500, body: { err: 'DB' } }]),
   { cls: 'ApiError', kind: 'server' });
on('404 -> ApiError(client)', await attempt([{ status: 404, body: { err: 'Ei ole' } }]),
   { cls: 'ApiError', kind: 'client' });
on('networkError -> ApiError(network)', await attempt([{ networkError: true }]),
   { cls: 'ApiError', kind: 'network' });
on('katkine JSON -> ApiError(format)', await attempt([{ status: 200, text: '{broken' }]),
   { cls: 'ApiError', kind: 'format' });

// 4. õnnelik tee: vaade saab TEISENDATUD andmed
const f = fakeFetch([{ status: 200, body: [RAW] }]);
const rows = await makeApi({ fetchFn: f }).events('sügis');
on('nimekiri on teisendatud', rows[0].free, 302);
on('nimekirja start on Date', rows[0].start instanceof Date, true);
on('search läheb URL-i', f.calls[0].url.includes('search=s%C3%BCgis'), true);
on('Accept-päis on kaasas', f.calls[0].options.headers.Accept, 'application/json');

// 5. POST
const f2 = fakeFetch([{ status: 201, body: { id: 5001 } }]);
const response = await makeApi({ fetchFn: f2 }).buyTickets(3, 2);
on('ost tagastab keha', response.id, 5001);
on('POST meetod', f2.calls[0].options.method, 'POST');
on('POST keha on JSON', JSON.parse(f2.calls[0].options.body), { event: 3, qty: 2 });
on('POST Content-Type', f2.calls[0].options.headers['Content-Type'], 'application/json');

// 6. ajalõpp on OMA laad: kasutaja näeb teadet ja võib korrata.
//    null jääb ainult kutsuja enda katkestusele (kind: 'abort').
const f3 = fakeFetch([{ delay: 120, status: 200, body: [] }]);
let timeoutErr = null;
try { await makeApi({ fetchFn: f3, timeout: 30 }).events(); } catch (e) { timeoutErr = e; }
on('ajalõpp annab laadi timeout', timeoutErr?.kind, 'timeout');
on('ajalõppu NÄIDATAKSE kasutajale', timeoutErr?.forUser, 'Server ei vastanud õigeaegselt.');
on('ajalõpp on korratav', timeoutErr?.repeatable, true);

// ── ★★★ KES PANEB HTML-i KOKKU ──────────────────────────────────────────
// Loeng 1 näitas kolme viisi. Valmis lehel näevad nad ÜHTEMOODI välja, seega
// otsustada saab ainult serveri ESIMESE vastuse pealt — täpselt seda näitab
// Ctrl+U. Siin on kolm päris kujuga vastust ja iga lehe JSON-päringute arv.
// ★ Õiged vastused on siin SÕRMEJÄLJENA, mitte kirjas: see fail on sul käes,
//   ja otsus on sinu teha. Vale vastuse korral ütleb kontroll, MIS vastus.
const fingerprint = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const cellOk = (label, key, value, expected) => {
  if (fingerprint(`${key}:${value}`) === expected) ok++;
  else broken.push(`${label} ${key}: ${JSON.stringify(value)} ei pea paika`);
};
const RESPONSES = {
  A: { html: '<main id="root"></main><script type="module" src="/app.js"></script>',
       jsonRequests: 1 },
  B: { html: '<main><article><h2>Seanss kell 18</h2><p>Vabu kohti 12</p></article></main>',
       jsonRequests: 0 },
  C: { html: '<main id="content"></main><script src="/view.js"></script>', jsonRequests: 0 },
};
console.log(`   kolm vastust, pikkused: ${Object.entries(RESPONSES)
  .map(([k, v]) => `${k} ${v.html.length}`).join(', ')} baiti`);
const MODE_FP = { A: '97725ec4f5d7', B: '51e8e838804d', C: 'fbdd4244caca' };
for (const [k, r] of Object.entries(RESPONSES)) {
  cellOk('★★★ renderdusviis, vastus', k, renderMode(r), MODE_FP[k]);
}
const trips = ['server', 'client', 'api_spa'].map((m) => RENDER_MODES[m]?.roundTrips);
cellOk('★★ täisringide arv (server, client, api_spa)', 'roundTrips',
       JSON.stringify(trips), '9d169edaa4b1');
on('★★ otsimootori hind on kirjas kõigil kolmel',
   Object.values(RENDER_MODES).every((v) => typeof v.searchEngine === 'string'), true);

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
