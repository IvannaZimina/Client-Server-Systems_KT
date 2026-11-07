// C07 Ex4 — ETTE ANTUD proovijooks.  node check-validate.js   (vajab zod-i)
import * as V from '../server/validate.js';
import { ServiceError } from '../server/layers.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

const HEALTHY = { event: 3, qty: 2, buyer: 'Mari Maasikas', email: 'mari@example.ee' };

// 1. skeem läbib terve sisendi
let r = V.OrderSchema.safeParse(HEALTHY);
on('terve sisend läbib', r.success, true);
on('trim töötab', V.OrderSchema.safeParse({ ...HEALTHY, buyer: '  Mari  ' }).data.buyer, 'Mari');

// 2. iga piirang toimib
const broken1 = (change) => {
  const x = V.OrderSchema.safeParse({ ...HEALTHY, ...change });
  return x.success ? null : Object.keys(V.zodFields(x.error));
};
on('qty 0 -> viga', broken1({ qty: 0 }), ['qty']);
on('qty 11 -> viga', broken1({ qty: 11 }), ['qty']);
on('qty murdarv -> viga', broken1({ qty: 1.5 }), ['qty']);
on('vigane email -> viga', broken1({ email: 'mari' }), ['email']);
on('lühike nimi -> viga', broken1({ buyer: 'M' }), ['buyer']);
on('puuduv väli -> viga', (() => { const { email, ...without } = HEALTHY;
  const x = V.OrderSchema.safeParse(without);
  return Object.keys(V.zodFields(x.error)); })(), ['email']);
// ★ strict: TUNDMATU VÄLI on viga, mitte vaikne kadu
on('tundmatu väli -> viga', V.OrderSchema.safeParse({ ...HEALTHY, role: 'admin' }).success, false);
// ★ kehas EI kasutata coerce'i: "5" arvuväljal on kliendi viga
on('sõne arvuväljal -> viga', broken1({ qty: '2' }), ['qty']);

// mitu viga korraga -> KÕIK väljad tulevad välja
const many = V.OrderSchema.safeParse({ event: -1, qty: 0, buyer: 'M', email: 'x' });
on('★ mitu viga -> kõik väljad', Object.keys(V.zodFields(many.error)).sort(),
   ['buyer', 'email', 'event', 'qty']);

// 3. päringustring: coerce ON, lisaparameetrid VISATAKSE ÄRA
r = V.ListQuery.safeParse({ page: '3', per: '10', min_price: '20' });
// vordlen välja kaupa: JSON.stringify on võtmete JÄRJEKORRA suhtes tundlik
on('päringustringis coerce: page', r.data.page, 3);
on('päringustringis coerce: per', r.data.per, 10);
on('päringustringis coerce: min_price', r.data.min_price, 20);
on('lisaparameeter visatakse ära',
   V.ListQuery.safeParse({ page: '1', password: 'x' }).data.password, undefined);
// ★ Sama poliitika nagu Ex3 createPlan(): lehekülje väli EI anna kunagi 422 —
//   vigane langeb vaikeväärtusele, üle lae kärbitakse; vigane filter ja
//   tundmatu sortimisväli annavad vea.
on('per üle lae kärbitakse ka skeemis', V.ListQuery.safeParse({ per: '500' }).data?.per, 100);
on('vigane page -> 1, mitte 422', V.ListQuery.safeParse({ page: 'abc' }).data?.page, 1);
on('negatiivne page -> 1', V.ListQuery.safeParse({ page: '-5' }).data?.page, 1);
on('per 0 -> vaikeväärtus', V.ListQuery.safeParse({ per: '0' }).data?.per, 20);
on('★ vigane filter -> viga (nagu readFilters)',
   V.ListQuery.safeParse({ min_price: 'abc' }).success, false);
on('tundmatu sort -> viga', V.ListQuery.safeParse({ sort: 'password' }).success, false);
// ★ Skeem tuleb Ex3 lubatud väärtuste loendist: free ja free_at_least on seal.
on('free on sorditav (SORTABLE)', V.ListQuery.safeParse({ sort: '-free' }).success, true);
on('free_at_least jääb alles (FILTERABLE)',
   V.ListQuery.safeParse({ free_at_least: '100' }).data?.free_at_least, 100);

// 4. muudatus: vähemalt üks väli
on('tühi muudatus -> viga', V.EventChange.safeParse({}).success, false);
on('üks väli piisab', V.EventChange.safeParse({ price: 30 }).success, true);
on('negatiivne price -> viga', V.EventChange.safeParse({ price: -1 }).success, false);

// 5. ühtne veakuju
const shape = V.errorShape('INVALID_INPUT', 'Vigane sisend', { fields: { email: 'vale' } });
on('veakujus on code', shape.code, 'INVALID_INPUT');
on('veakujus on väljad', shape.fields.email, 'vale');
on('tühjad väljad jäävad välja', V.errorShape('NOT_FOUND', 'Ei ole').fields, undefined);
on('code -> HTTP-staatus', V.ERROR_CODES.INVALID_INPUT, 422);
on('NOT_FOUND -> 404', V.ERROR_CODES.NOT_FOUND, 404);

// 6. vahevara ASENDAB req.body puhastatud väärtusega
const res = () => { const r2 = { code: 200, body: null };
  r2.status = (k) => { r2.code = k; return r2; };
  r2.json = (x) => { r2.body = x; return r2; };
  return r2; };
let nextCalled = false;
const req = { body: { ...HEALTHY, buyer: '  Mari  ', role: 'admin' } };
V.validate(V.OrderSchema)(req, res(), () => { nextCalled = true; });
on('tundmatu väli peatab (strict)', nextCalled, false);

nextCalled = false;
const req2 = { body: { ...HEALTHY, buyer: '  Mari  ' } };
V.validate(V.OrderSchema)(req2, res(), () => { nextCalled = true; });
on('terve sisend läheb edasi', nextCalled, true);
on('★ req.body ON ASENDATUD puhastatuga', req2.body.buyer, 'Mari');

const r3 = res(); let l3 = false;
V.validate(V.OrderSchema)({ body: { qty: 0 } }, r3, () => { l3 = true; });
on('vigane sisend -> 422', r3.code, 422);
on('vigane sisend EI lähe edasi', l3, false);
on('422 body on ühtne kuju', r3.body.code, 'INVALID_INPUT');

// ★ Teenuse vead (Ex1) tulevad SAMAS kujus: err, code ja detail.
const handler = V.serviceErrorHandler();
const r4 = res();
handler(new ServiceError('not_found', 'Ei ole', { id: 9 }), {}, r4, () => {});
on('teenuse viga -> 404 ja ühtne kuju', [r4.code, r4.body],
   [404, { err: 'Ei ole', code: 'NOT_FOUND', detail: { id: 9 } }]);
const r5 = res();
handler(new ServiceError('forbidden', 'Ei tohi'), {}, r5, () => {});
on('forbidden -> 403 FORBIDDEN', [r5.code, r5.body.code], [403, 'FORBIDDEN']);
let passed = null;
handler(new TypeError('bug'), {}, res(), (e) => { passed = e.constructor.name; });
on('tundmatu viga antakse EDASI', passed, 'TypeError');

// 7. puhastamine
on('juhtmärgid eemaldatakse',
   V.cleanText('  S' + String.fromCharCode(0)
     + 'ügis' + String.fromCharCode(27) + '  '), 'Sügis');
on('★ < JÄÄB ALLES (XSS-kaitse on VÄLJUNDIS)', V.cleanText('<b>Sügis</b>'), '<b>Sügis</b>');
const CR = String.fromCharCode(13);
const LF = String.fromCharCode(10);
on('★ reavahetus JÄÄB: mitmerealine märkus jääb mitmerealiseks',
   V.cleanText('Ratastool' + CR + LF + 'rida 3'), 'Ratastool' + LF + 'rida 3');

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
