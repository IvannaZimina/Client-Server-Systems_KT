// C07 Ex3 — ETTE ANTUD proovijooks.  node check-query.js
import * as P from '../server/query.js';
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

// 1. sort — lubatud väärtuste loend
on('vaikimisi start kasvavalt', P.readSort(undefined), { field: 'start', dir: 1 });
on('miinus = kahanevalt', P.readSort('-price'), { field: 'price', dir: -1 });
const sortErr = (x) => { try { P.readSort(x); return null; } catch (e) { return e.fields; } };
on('tundmatu väli VISKAB', sortErr('password')?.sort?.startsWith('lubatud:'), true);
on('SQL-i katse VISKAB', sortErr('price; DROP TABLE') !== null, true);

// 2. lehekülg — lagi ja vaikevaartused
on('vaikimisi page 1', P.readPage({}).page, 1);
on('vaikimisi per 20', P.readPage({}).per, P.PAGE_DEFAULT);
on('offset arvutatakse', P.readPage({ page: '3', per: '10' }).offset, 20);
on('★ lagi kehtib', P.readPage({ per: '1000000' }).per, P.PAGE_MAX);
on('negatiivne page -> 1', P.readPage({ page: '-5' }).page, 1);
on('vigane page -> vaikeväärtus, MITTE viga', P.readPage({ page: 'abc' }).page, 1);
on('null per -> vaikeväärtus', P.readPage({ per: '0' }).per, P.PAGE_DEFAULT);

// 3. filtrid
on('venue loetakse', P.readFilters({ venue: 'Estonia' }), { venue: 'Estonia' });
on('arv loetakse', P.readFilters({ min_price: '20' }), { min_price: 20 });
// ★ Vigane filtri väärtus VISKAB: filtri äralangemine näitaks KÕIKI sündmusi.
const filterErr = (q) => { try { P.readFilters(q); return null; }
  catch (e) { return e.fields ? Object.keys(e.fields) : 'ilma fields-ita'; } };
on('★ vigane arv VISKAB', filterErr({ min_price: 'abc' }), ['min_price']);
on('negatiivne arv VISKAB', filterErr({ free_at_least: '-5' }), ['free_at_least']);
on('★ plaan ei jäta vigast filtrit vaikselt ära',
   (() => { try { P.createPlan({ min_price: 'abc' }); return 'läbis'; }
     catch (e) { return 'viskas'; } })(), 'viskas');
on('tundmatu parameeter langeb ära', P.readFilters({ password: 'x' }), {});
on('tühi sõne langeb ära', P.readFilters({ venue: '' }), {});

// 4. plaan ja rakendamine
let r = P.apply(DATA, P.createPlan({}));
on('kõik neli', r.total, 4);
on('pages 1', r.pages, 1);
on('vaikesort on start', r.rows[0].name, 'Sügiskontsert');

r = P.apply(DATA, P.createPlan({ sort: '-price' }));
on('kahanev price', r.rows.map((s) => s.price), [45, 24, 15, 8]);
r = P.apply(DATA, P.createPlan({ sort: 'free' }));
on('★ arvutatud väli (free) sordib', r.rows[0].name, 'Talveball');

r = P.apply(DATA, P.createPlan({ search: 'krahl' }));
on('search vaatab ka kohta', r.total, 1);
r = P.apply(DATA, P.createPlan({ min_price: '15', max_price: '30' }));
on('hinnavahemik', r.rows.map((s) => s.price).sort((a, b) => a - b), [15, 24]);
r = P.apply(DATA, P.createPlan({ free_at_least: '100' }));
// vabu: 420-118=302, 900-900=0, 120-37=83, 200-0=200 -> kaks on >= 100
on('free_at_least', r.total, 2);

// ★ KOKKU arvutatakse ENNE lehekülge
r = P.apply(DATA, P.createPlan({ per: '2', page: '1' }));
on('total on KÕIK vasted, mitte lehekülg', r.total, 4);
on('rows on ainult lehekülg', r.rows.length, 2);
on('pages 2', r.pages, 2);
const page2 = P.apply(DATA, P.createPlan({ per: '2', page: '2' }));
on('teine lehekülg on ERI rows', page2.rows[0].id !== r.rows[0].id, true);
on('leheküljed katavad kõik', r.rows.length + page2.rows.length, 4);

// ★ STABIILNE sort: võrdsete korral otsustab id
const same = [{ id: 3, name: 'B', venue: 'X', price: 10, seats: 1, sold: 0, start: '2030-01-01' },
              { id: 1, name: 'A', venue: 'X', price: 10, seats: 1, sold: 0, start: '2030-01-01' },
              { id: 2, name: 'C', venue: 'X', price: 10, seats: 1, sold: 0, start: '2030-01-01' }];
on('võrdsete korral otsustab id',
   P.apply(same, P.createPlan({ sort: 'price' })).rows.map((s) => s.id), [1, 2, 3]);

// tühi tulemus EI OLE viga
r = P.apply(DATA, P.createPlan({ search: 'xyz' }));
on('tühi tulemus: total 0', r.total, 0);
on('tühi tulemus: pages ikka 1', r.pages, 1);

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
