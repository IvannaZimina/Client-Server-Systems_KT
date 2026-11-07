// C07 Ex1 — ETTE ANTUD proovijooks.  node check-layers.js
//
// ★ PANE TÄHELE: siin EI OLE Expressi ega HTTP-d. Kui teenuse testimiseks
//   oleks neid vaja, oleks sõltuvuste suund katki.
import { createHash } from 'node:crypto';
import * as K from '../server/layers.js';
import { createMemoryStore, createCountingStore } from './memory-store.js';
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

// ★ Vea liigid on siin SÕRMEJÄLJENA, mitte kirjas: see fail on sul käes, ja
//   liigi valik on sinu teha. Vale lahtri korral ütleb kontroll, MIS juhtum.
const fingerprint = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const cellOk = (label, key, value, expected) => {
  if (fingerprint(`${key}:${value}`) === expected) ok++;
  else broken.push(`${label} ${key}: ${JSON.stringify(value)} ei pea paika`);
};

const DATA = JSON.parse(fs.readFileSync(
  fileURLToPath(new URL('./events.json', import.meta.url)), 'utf8'));

// ★ Kell on samuti sõltuvus: teenus saab ta PARAMEETRINA ({ now }), nii et
//   ükski kontroll siin ei sõltu tänasest kuupäevast.
const at = (iso) => ({ now: () => new Date(iso) });
const BEFORE_ALL = at('2030-09-01T12:00');
const next = () => K.createEventService(createMemoryStore(DATA), BEFORE_ALL);

// 1. teenus töötab ILMA HTTP-ta
let t = next();
on('list annab neli', (await t.list()).length, 4);
on('search filtreerib', (await t.list({ search: 'talve' })).length, 1);
on('one annab sündmuse', (await t.one(3)).name, 'Improteater');

const err = async (f) => { try { await f(); return null; }
  catch (e) { return { cls: e.constructor.name, kind: e.kind }; } };
on('olematu -> ServiceError(not_found)', await err(() => t.one(99)),
   { cls: 'ServiceError', kind: 'not_found' });

// 2. ÄRIREEGLID kuuluvad teenusesse
on('ost õnnestub', (await t.buy(3, 2)).qty, 2);
cellOk('kohad ei jätku: vea liik', 'seatsGone',
       (await err(() => t.buy(2, 1)))?.kind, '8bb2c20621b4');
// Sündmus 1 algab 2030-10-04T19:00; kell otsustab, kas ta on juba toimunud.
const service = (clock) => K.createEventService(createMemoryStore(DATA), clock);
on('enne algust ost läbib', (await service(at('2030-10-04T18:59')).buy(1, 1)).qty, 1);
cellOk('pärast algust: vea liik', 'eventStarted',
       (await err(() => service(at('2030-10-04T19:01')).buy(1, 1)))?.kind, 'a85d80d856dc');
// Ilma kellata võtab teenus praeguse aja: 2020. aasta sündmus on alati möödas.
const past = createMemoryStore([{ id: 50, name: 'Kevadkontsert', venue: 'X',
  start: '2020-01-01T19:00', seats: 100, sold: 0, price: 10 }]);
cellOk('vaikimisi kell, möödunud sündmus: vea liik', 'defaultClockPast',
       (await err(() => K.createEventService(past).buy(50, 1)))?.kind, '40ccbec1a204');

// 3. õigus on ärireegel, aga INFO tuleb kontrollerilt; KES tohib, ütleb antud
//    canEdit() (permissions.js)
t = next();
cellOk('ilma kasutajata: vea liik', 'noUser',
       (await err(() => t.update(1, { price: 30 }, null)))?.kind, '3f726fba02d5');
cellOk('canEdit ütleb ei: vea liik', 'canEditNo',
       (await err(() => t.update(1, { price: 30 }, { role: 'buyer' })))?.kind, '7668083c0f9b');
on('canEdit ütleb jah -> muudetud',
   (await t.update(1, { price: 30 }, { role: 'organizer' })).price, 30);

// 4. teenus kutsub repositooriumi ÕIGE arv kordi
const counting = createCountingStore(createMemoryStore(DATA));
const t2 = K.createEventService(counting, BEFORE_ALL);
await t2.buy(3, 1);
on('ost teeb ÜHE findById kutse', counting.callsNamed('findById'), 1);
on('ost teeb ÜHE addOrder kutse', counting.callsNamed('addOrder'), 1);
on('ost EI kutsu findAll', counting.callsNamed('findAll'), 0);

// 5. kontroller on ÕHUKE: ainult tõlge
const controller = K.createEventsController(next());
const fakeRes = () => { const r = { code: 200, body: null, loc: null };
  r.status = (k) => { r.code = k; return r; };
  r.location = (l) => { r.loc = l; return r; };
  r.json = (x) => { r.body = x; return r; }; return r; };

let res = fakeRes();
await controller.list({ query: {} }, res);
on('kontroller: nimekiri', res.body.length, 4);

res = fakeRes();
await controller.buy({ params: { id: '3' }, body: { qty: 2 } }, res);
on('kontroller: ost annab 201', res.code, 201);
on('kontroller: ost annab Location', res.loc, '/api/orders/7001');

// 6. liik -> HTTP-kood on ÜHES kohas
on('not_found -> 404', K.KIND_TO_CODE.not_found, 404);
on('conflict -> 409', K.KIND_TO_CODE.conflict, 409);
on('invalid -> 422', K.KIND_TO_CODE.invalid, 422);
on('unauthenticated -> 401', K.KIND_TO_CODE.unauthenticated, 401);
on('forbidden -> 403', K.KIND_TO_CODE.forbidden, 403);

// veakäsitleja annab tundmatu vea EDASI, ei neela alla
const handler = K.serviceErrorHandler();
let passedOn = null;
handler(new TypeError('bug'), {}, fakeRes(), (v) => { passedOn = v.constructor.name; });
on('tundmatu viga antakse EDASI', passedOn, 'TypeError');

res = fakeRes();
handler(new K.ServiceError('not_found', 'Ei ole', { id: 9 }), {}, res, () => {});
on('ServiceError -> 404', res.code, 404);
on('detail on vastuses', res.body.detail, { id: 9 });

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
