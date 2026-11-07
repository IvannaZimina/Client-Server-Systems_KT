// C05 Ex6 — ETTE ANTUD proovijooks.  node check-sw.js
import { setupEnv, FakeCache, FakeResponse } from './fake-cache.js';
const env = setupEnv();                 // PEAB olema enne importi
const SW = await import('../public/sw.js');

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

// 1. strateegia valik tee järgi
on('kest', SW.pick('/index.html'), 'shell-first');
on('sündmuste nimekiri', SW.pick('/api/events?search=x'), 'network-first');
on('OSTU EI vahemälustata', SW.pick('/api/orders'), 'network-only');
on('piletid', SW.pick('/api/tickets/5001'), 'stale-while-revalidate');

// 2. cache-first
let c = new FakeCache();
let calls = 0;
const fromNetwork = async () => { calls += 1; return new FakeResponse('fromNetwork'); };
let v = await SW.shellFirst('/logo.svg', { cache: c, fetchFn: fromNetwork });
on('esimene kord küsib võrgust', await v.text(), 'fromNetwork');
on('esimene kord tegi päringu', calls, 1);
v = await SW.shellFirst('/logo.svg', { cache: c, fetchFn: fromNetwork });
on('teine kord tuleb vahemälust', await v.text(), 'fromNetwork');
on('teine kord EI teinud päringut', calls, 1);

// 3. network-first: võrk võidab, aga võrguta tuleb vahemälu
c = new FakeCache();
await c.put('/api/events', new FakeResponse('vana', { source: 'cache' }));
v = await SW.networkFirst('/api/events',
    { cache: c, fetchFn: async () => new FakeResponse('värske') });
on('võrguga tuleb VÄRSKE', await v.text(), 'värske');
v = await SW.networkFirst('/api/events', {
  cache: c, fetchFn: async () => { throw new TypeError('Failed to fetch'); } });
on('võrguta tuleb VAHEMÄLUST', await v.text(), 'värske');

// võrguta JA vahemälu tühi -> viskab
let thrown = null;
try {
  await SW.networkFirst('/api/next', { cache: new FakeCache(),
    fetchFn: async () => { throw new TypeError('Failed to fetch'); } });
} catch (e) { thrown = e.constructor.name; }
on('võrguta ja tühi vahemälu -> viskab', thrown, 'TypeError');

// 4. stale-while-revalidate: annab VANA kohe, uuendab taustal
c = new FakeCache();
await c.put('/api/tickets/1', new FakeResponse('vana'));
v = await SW.staleWhileRevalidate('/api/tickets/1', {
  cache: c, fetchFn: async () => new FakeResponse('next') });
on('SWR annab VANA kohe', await v.text(), 'vana');
await new Promise((r) => setTimeout(r, 10));
on('taust uuendas vahemälu', await (await c.match('/api/tickets/1')).text(), 'next');

// tühi vahemälu -> ootab võrku
c = new FakeCache();
v = await SW.staleWhileRevalidate('/api/tickets/2', {
  cache: c, fetchFn: async () => new FakeResponse('first'), awaitBackground: true });
on('tühja vahemäluga ootab võrku', await v.text(), 'first');

// taust EI TOHI viga edasi visata
c = new FakeCache();
await c.put('/x', new FakeResponse('vana'));
v = await SW.staleWhileRevalidate('/x', { cache: c,
  fetchFn: async () => { throw new TypeError('broken'); }, awaitBackground: true });
on('tausta viga ei sega kasutajat', await v.text(), 'vana');

// 5. elutsükkel
const wait = (e) => e.waitUntil.mock;
let promise = null;
await env.self.events.install({ waitUntil: (p) => { promise = p; } });
await promise;
on('install laadis kesta', (await env.caches.open('piletikassa-v3')).size >= 5, true);
on('install kutsus skipWaiting', env.self.skipped, true);

await env.caches.open('piletikassa-v1');     // vana versioon
await env.caches.open('piletikassa-v2');
await env.self.events.activate({ waitUntil: (p) => { promise = p; } });
await promise;
on('activate kustutas VANAD vahemälud', await env.caches.keys(), ['piletikassa-v3']);
on('activate võttis lehed üle', env.self.claimed, true);

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
