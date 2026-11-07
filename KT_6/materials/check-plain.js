// C06 Ex2 — ETTE ANTUD proovijooks.  node check-plain.js
import * as P from '../server/plain.js';
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

// 1. seaded
const healthy = { PORT: '3006', DB_URL: 'mysql://x', SESSION_SECRET: 's' };
on('terve keskkond läbib', P.readConfig(healthy).port, 3006);
on('vaikeport', P.readConfig({ DB_URL: 'x', SESSION_SECRET: 's' }).port, 3006);
on('vaikelaad', P.readConfig(healthy).kind, 'development');

const missing = (env) => {
  try { P.readConfig(env); return null; } catch (e) { return e.message; }
};
on('puuduv DB_URL kukub KÄIVITUSEL',
   missing({ SESSION_SECRET: 's' }), 'Puuduvad keskkonnamuutujad: DB_URL');
on('kaks puudujat nimetatakse mõlemad',
   missing({}), 'Puuduvad keskkonnamuutujad: DB_URL, SESSION_SECRET');
on('tühi sõne loeb puuduvaks',
   missing({ DB_URL: '', SESSION_SECRET: 's' }), 'Puuduvad keskkonnamuutujad: DB_URL');
let thrown = null;
try { P.readConfig({ ...healthy, PORT: '99999' }); } catch (e) { thrown = e.constructor.name; }
on('vigane port viskab RangeError', thrown, 'RangeError');

// ★ saladust EI LOGITA
const log = P.configForLog(P.readConfig(healthy));
on('DB_URL on logis peidetud', log.databaseUrl, '***');
on('võti on logis peidetud', log.sessionKey, '***');
on('port on logis nähtav', log.port, 3006);

// 2. marsruudi sobitus
on('täpne tee', P.match('/api/events', '/api/events'), {});
on('parameeter', P.match('/api/events/:id', '/api/events/3'), { id: '3' });
on('vale pikkus -> null', P.match('/api/events/:id', '/api/events'), null);
on('vale segment -> null', P.match('/api/orders/:id', '/api/events/3'), null);
on('kaks parameetrit',
   P.match('/api/:what/:id', '/api/orders/7'), { what: 'orders', id: '7' });
on('URL-kodeering lahti', P.match('/api/:name', '/api/S%C3%BCgis'), { name: 'Sügis' });

// 3. käsitleja — päris HTTP-server juhusliku pordi peal
const server = P.makeServer(DATA);
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const B = `http://localhost:${port}`;

const v1 = await fetch(`${B}/api/events`);
on('nimekiri 200', v1.status, 200);
on('nimekirjas neli', (await v1.json()).length, 4);
on('Content-Type on JSON', v1.headers.get('content-type').startsWith('application/json'), true);
on('Content-Length on seatud', v1.headers.get('content-length') !== null, true);

on('üks sündmus', (await (await fetch(`${B}/api/events/3`)).json()).name, 'Improteater');
on('olematu sündmus 404', (await fetch(`${B}/api/events/99`)).status, 404);
on('tundmatu tee 404', (await fetch(`${B}/unknown`)).status, 404);

const v2 = await fetch(`${B}/api/orders`, { method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 3, qty: 2 }) });
on('ost 201', v2.status, 201);
on('ost annab Location', v2.headers.get('location'), '/api/orders/9001');

on('puuduv väli 422', (await fetch(`${B}/api/orders`, { method: 'POST',
  headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 422);
on('vigane JSON 400', (await fetch(`${B}/api/orders`, { method: 'POST',
  headers: { 'Content-Type': 'application/json' }, body: '{broken' })).status, 400);

// ★ keha lagi: 1 MB ületav päring ei tohi serverit tappa
const big = 'x'.repeat(1_200_000);
const v3 = await fetch(`${B}/api/orders`, { method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 1, junk: big }) }).catch(() => ({ status: 'aborted' }));
on('liiga suur keha -> 413 või katkestus', [413, 'aborted'].includes(v3.status), true);
on('server on pärast seda ELUS', (await fetch(`${B}/api/events`)).status, 200);

server.close();
console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
