// C06 Ex3 — ETTE ANTUD proovijooks.  node check-app.js
import { createApp } from '../server/app.js';
import { createStore } from './store.js';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

const DATA = JSON.parse(fs.readFileSync(
  fileURLToPath(new URL('./events.json', import.meta.url)), 'utf8'));

const logLines = [];
const store = createStore(DATA);
const app = createApp(store, { log: (x) => logLines.push(String(x)) });
const server = app.listen(0);
await new Promise((r) => server.once('listening', r));
const B = `http://localhost:${server.address().port}`;
const J = async (route, s) => {
  const v = await fetch(B + route, s);
  return { code: v.status, body: await v.json().catch(() => null), v };
};

// 1. nimekiri ja päringustring
let r = await J('/api/events');
on('nimekiri 200', r.code, 200);
on('nimekirjas on 4 sündmust', r.body?.length, 4);
r = await J('/api/events?search=talve');
on('search filtreerib', r.body?.length, 1);

// 2. ★ konkreetne tee ENNE parameetrilist
r = await J('/api/events/popular');
on('populaarsed EI lähe /:id alla', r.code, 200);
on('populaarseid on 1 (Talveball)', r.body.length, 1);

// 3. teeparameeter
on('üks sündmus', (await J('/api/events/3')).body.name, 'Improteater');
on('olematu -> 404', (await J('/api/events/99')).code, 404);
on('mitte-arv -> 400', (await J('/api/events/abc')).code, 400);

// 4. express.json ja valideerimine
r = await J('/api/orders', { method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 3, qty: 2 }) });
on('ost 201', r.code, 201);
on('ost annab Location', r.v.headers.get('location'), '/api/orders/9001');
on('vigased väljad -> 422', (await J('/api/orders', { method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 'x' }) })).code, 422);
on('olematu event -> 422', (await J('/api/orders', { method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 99, qty: 1 }) })).code, 422);
// ★ 409: seis on vastuoluline (Talveball on välja müüdud), mitte sisend vigane
on('seats ei jätku -> 409', (await J('/api/orders', { method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 2, qty: 1 }) })).code, 409);

// 5. 204 ja tühi keha
const deleted = await fetch(`${B}/api/orders/9001`, { method: 'DELETE' });
on('kustutamine 204', deleted.status, 204);
on('204 keha on TÜHI', (await deleted.text()).length, 0);
on('teine kustutus 404', (await fetch(`${B}/api/orders/9001`, { method: 'DELETE' })).status, 404);

// 6. keha suuruse piir: 10 kB. 20 000 märki mahuks vaikimisi 100 kB piiri alla,
//    seega see kontroll kukub, kui piir on seadmata.
r = await J('/api/orders', { method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 3, qty: 1, note: 'x'.repeat(20000) }) });
on('liiga suur keha -> 413', r.code, 413);
on('server vastab pärast 413-t edasi', (await J('/api/events')).code, 200);
r = await J('/api/events/1', { method: 'PATCH',
  headers: { 'Content-Type': 'application/json' }, body: '{"price":30}' });
on('PATCH -> 200', r.code, 200);
on('price muutus', r.body.price, 30);

// 7. päringu ID ja logi
const v = await fetch(`${B}/api/health`);
on('tervisekontroll 200', v.status, 200);
on('X-Request-Id on vastuses', v.headers.get('x-request-id') !== null, true);
const own = await fetch(`${B}/api/health`, { headers: { 'X-Request-Id': 'minu-id' } });
on('kliendi ID võetakse üle', own.headers.get('x-request-id'), 'minu-id');
on('logi sai ridu', logLines.length > 0, true);
on('logirida sisaldab koodi ja aega',
   /GET \/api\/health 200 [\d.]+ ms/.test(logLines.at(-1)), true);

// 8. 404: tundmatu tee saab JSON-i, mitte Expressi HTML-lehte
r = await J('/unknown');
on('tundmatu tee 404', r.code, 404);
on('404 keha on JSON', r.body?.route, '/unknown');

server.close();
console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
