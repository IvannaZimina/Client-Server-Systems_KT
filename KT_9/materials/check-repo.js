// C09 Ex3 — ETTE ANTUD proovijooks.  node check-repo.js
import { makeTestPool } from './db.js';
import { createEventRepo, rowToEvent } from '../db/repo.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

// ★ VALVUR. Andmebaasi vastu joostes on kaks viisi läbi kukkuda: vale
//   vastus ja MITTE ÜHTKI vastust. Teine on salakavalam — kui ühendust ei
//   vabastata (Ex2: kogumi ammendumine on VAIKNE) või kui lukk jääb lahti
//   (Ex5), ei tule viga, vaid EI TULE MIDAGI. Ilma valvurita seisab jooks
//   igavesti ja sa ei tea, MIDA oodatakse.
//
//   Mõõdetud: süsti `release()` kutse Ex5-st välja ja jooksuta ilma
//   valvurita — protsess ripub, kuni sa ta ise tapad.
const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 90000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s — keegi ootab midagi, mis ei tule.`);
  console.log('      Kahtlusta: vabastamata ühendus (`conn.release()`) või lahtine tehing.');
  process.exit(1);
}, WATCHDOG_MS);

const pool = makeTestPool();
const repo = createEventRepo(pool);

// ── 1. RIDA EI OLE DOMEENIOBJEKT ────────────────────────────────────────
const shape = rowToEvent({ id: 7, name: 'X', starts_at: '2026-10-04 19:00:00', seat_count: 12,
                            price: '24.00', venue_name: 'Vanemuine', venue_city: 'Tartu' });
on('★ DECIMAL-sõne saab ARVUKS', shape.price, 24);
on('★ ja ta on TÕESTI arv, mitte sõne', typeof shape.price, 'number');
on('★ snake_case saab pesastatud objektiks', shape.venue, { name: 'Vanemuine', city: 'Tartu' });
on('★ veerg saab domeeni nime: starts_at -> startsAt, seat_count -> seatCount',
   [shape.startsAt, shape.seatCount], ['2026-10-04 19:00:00', 12]);
const columns = ['starts_at', 'seat_count', 'venue_name'];
on('★ veeru nimi domeeni ei jõua', columns.filter((k) => k in shape), []);
on('lamedad väljad ei kao', [shape.id, shape.name], [7, 'X']);

// ★ MIKS SEE LOEB: sõne käitub aritmeetikas teisiti kui arv.
on('★ sõnena oleks "24.00" + 2 = "24.002"', '24.00' + 2, '24.002');
on('   arvuna on 24 + 2 = 26', shape.price + 2, 26);

// ── 2. LUGEMINE ─────────────────────────────────────────────────────────
const all = await repo.findAll({ per: 5 });
on('nimekiri ei ole tühi', all.length > 0, true);
on('nimekiri austab per-piiri', all.length <= 5, true);
on('★ ka nimekirjas on price ARV', typeof all[0].price, 'number');
on('★ repositoorium EI liida koondnäitajaid (see on Ex4 töö)',
   all[0].free, undefined);
on('venue on JOIN-itud kaasa', typeof all[0].venue.city, 'string');

const total = await repo.readTotal();
on('★ koguarv on ERALDI päring (SQL_CALC_FOUND_ROWS on iganenud)',
   total >= all.length, true);

const one = await repo.findById(all[0].id);
on('findById annab sama rea', one.name, all[0].name);
on('★ olematu id -> null, mitte viga', await repo.findById(999999), null);

// ── 3. SORTIMINE JA OTSING ──────────────────────────────────────────────
const prices = (await repo.findAll({ sort: 'price', dir: 'ASC', per: 50 })).map((s) => s.price);
on('★ sortimine töötab andmebaasis',
   prices.every((h, i) => i === 0 || prices[i - 1] <= h), true);
const desc = (await repo.findAll({ sort: 'price', dir: 'DESC', per: 50 }))
  .map((s) => s.price);
on('★ kahanev suund on ka päriselt kahanev',
   desc.every((h, i) => i === 0 || desc[i - 1] >= h), true);
on('★ tundmatu sort ei kuku, vaid langeb vaikeväärtusele',
   (await repo.findAll({ sort: 'password_hash', per: 3 })).length > 0, true);

const found = await repo.findAll({ search: all[0].name.slice(0, 4), per: 50 });
on('search leiab enda', found.some((s) => s.id === all[0].id), true);
on('★ search, mis midagi ei leia, annab TÜHJA massiivi',
   (await repo.findAll({ search: 'zzz-ei-ole-olemas-zzz' })).length, 0);

// ── 4. KIRJUTAMINE ──────────────────────────────────────────────────────
const [[t]] = await pool.query('SELECT id FROM venue ORDER BY id LIMIT 1');
const [[k]] = await pool.query('SELECT id FROM user ORDER BY id LIMIT 1');
const next = await repo.add({ venueId: t.id, organizerId: k.id,
  name: 'Proovikontsert (repo)', startsAt: '2026-11-11 18:00:00', seatCount: 40, price: 19.5 });
on('★ add annab tagasi TERVE objekti, mitte ainult id-d', next.name, 'Proovikontsert (repo)');
on('ka uue rea price on arv', next.price, 19.5);

const changed = await repo.update(next.id, { price: 21.0 });
on('muutmine töötab', changed.price, 21);
const byDomainName = await repo.update(next.id, { seatCount: 50 });
on('★ muudetakse domeeni nime järgi', byDomainName.seatCount, 50);
const byColumnName = await repo.update(next.id, { seat_count: 60 });
on('★ veeru nimi sisendis ei ole väli', byColumnName.seatCount, 50);
on('★ tundmatu väli EI JÕUA SQL-i (ja ei kuku ka)',
   (await repo.update(next.id, { password_hash: 'x' })).price, 21);
on('★ olematu rea muutmine -> null (see on 404, mitte 500)',
   await repo.update(999999, { price: 1 }), null);
on('★ sama väärtus uuesti -> ikka objekt, mitte null',
   (await repo.update(next.id, { price: 21.0 })).id, next.id);

on('kustutamine õnnestub', await repo.remove(next.id), true);
on('★ teine kustutamine annab false, mitte viga', await repo.remove(next.id), false);
on('kustutatut ei leia', await repo.findById(next.id), null);

await pool.end();
console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
