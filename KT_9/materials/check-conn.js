// C09 Ex2 — ETTE ANTUD proovijooks.  node check-conn.js
import { SETTINGS, makeTestPool } from './db.js';
import * as U from '../db/conn.js';

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

// ── 1. SEADISTUS KUKUB KÄIVITUSEL, MITTE ESIMESE PÄRINGU PEAL ───────────
const err = (env) => { try { U.readSettings(env); return null; } catch (e) { return e.message; } };
on('★ puuduv DB_PASSWORD nimetatakse ÄRA', err({ DB_HOST: 'h', DB_USER: 'u', DB_NAME: 'd' })
   ?.includes('DB_PASSWORD'), true);
on('kõik neli puudu -> kõik neli teates',
   ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'].every((n) => err({}).includes(n)), true);
const whole = U.readSettings({ DB_HOST: 'h', DB_USER: 'u', DB_PASSWORD: 'p', DB_NAME: 'd' });
on('port on vaikimisi 3306', whole.port, 3306);
on('port tuleb keskkonnast ARVUNA',
   U.readSettings({ DB_HOST: 'h', DB_USER: 'u', DB_PASSWORD: 'p',
               DB_NAME: 'd', DB_PORT: '3309' }).port,
   3309);
on('★ tühi sõne loeb puuduvaks (ohtlikum kui puudumine)',
   err({ DB_HOST: 'h', DB_USER: 'u', DB_PASSWORD: '', DB_NAME: 'd' })
     ?.includes('DB_PASSWORD'), true);

// ── 2. ORDER BY EI SAA OLLA PARAMEETER ──────────────────────────────────
on('lubatud väli läbib', U.buildOrderBy('price', 'DESC'), 'ORDER BY price DESC, id ASC');
on('★ vaikesuund on ASC', U.buildOrderBy('name'), 'ORDER BY name ASC, id ASC');
on('★ tundmatu dir langeb ASC peale, mitte SQL-i',
   U.buildOrderBy('name', 'DESC; DROP TABLE ticket'), 'ORDER BY name ASC, id ASC');
on('★ tundmatu väli VISKAB, mitte ei vaiki',
   (() => { try { U.buildOrderBy('password_hash'); return 'did not throw'; }
            catch (e) { return e.constructor.name; } })(), 'RangeError');
on('★ teisene võti on ALATI kaasas (muidu on leheküljed määramata)',
   U.buildOrderBy('price').endsWith(', id ASC'), true);

// ── 3. IN-KLAUSEL: MÕLEMAD HARUD ON TERVE TINGIMUS ──────────────────────
// ★ Kui üks haru annaks lõigu (`IN (?, ?)`) ja teine terve tingimuse
//   (`1 = 0`), kirjutaks kutsuja `WHERE id ${sql}` — ja tühi massiiv annaks
//   `WHERE id 1 = 0`, sama süntaksivea mis `IN ()`.
on('kolm väärtust -> veerg ja kolm küsimärki', U.inClause('id', [1, 2, 3]).sql, 'id IN (?, ?, ?)');
on('parameetrid tulevad kaasa', U.inClause('id', [1, 2, 3]).param, [1, 2, 3]);
on('★ TÜHI massiiv annab 1 = 0, mitte süntaksivea', U.inClause('id', []).sql, '1 = 0');
on('tühja parameetrid on tühjad', U.inClause('id', []).param, []);

// ── 4. affectedRows JA changedRows ON ERI ASJAD ─────────────────────────
on('rida leiti ja muutus', U.updateResult({ affectedRows: 1, changedRows: 1 }),
   { found: 1, changed: 1, existing: true });
on('★ leiti, aga väärtus oli juba sama -> 200, mitte 404',
   U.updateResult({ affectedRows: 1, changedRows: 0 }), { found: 1, changed: 0, existing: true });
on('★ ei leidnud -> 404', U.updateResult({ affectedRows: 0, changedRows: 0 }).existing, false);

// ── 5. PÄRIS ANDMEBAAS: kogum, execute, tulemuse kuju ───────────────────
const pool = U.makePool(SETTINGS, { size: 4 });
const [[first]] = await pool.query('SELECT id FROM event ORDER BY id LIMIT 1');
const s = await U.readEvent(pool, first.id);
on('readEvent leiab rea', s.id, first.id);
on('★ olematu id annab null, mitte undefined', await U.readEvent(pool, 999999), null);

// ★ Mõlemad harud lähevad SAMASSE kohta — otse WHERE järele — ja baas võtab
//   mõlemad vastu.
const whereIn = async (values) => {
  const c = U.inClause('id', values);
  const [r] = await pool.execute(`SELECT id FROM event WHERE ${c.sql}`, c.param);
  return r.length;
};
on('★ inClause läheb otse WHERE järele', await whereIn([first.id]), 1);
on('★★ ka tühi haru on terve tingimus: null rida, mitte süntaksiviga', await whereIn([]), 0);

// ★ mysql2 tagastab MASSIIVI KAHEST. Kes seda ei tea, kirjutab
//   `const rows = await pool.execute(...)` ja imestab, miks .length on 2.
const rows = await pool.execute('SELECT id FROM event LIMIT 3');
on('★ execute annab [rows, metaandmed]', rows.length, 2);
on('metaandmetes on veeru nimi', rows[1][0].name, 'id');

// ★ SQL-i SÜSTIMINE: parameetrina on „1 OR 1=1“ lihtsalt tekst.
const [risky] = await pool.execute('SELECT id FROM event WHERE name = ?', ["' OR '1'='1"]);
on('★★ süstimiskatse parameetrina annab NULL rida', risky.length, 0);

// ★ KOGUMI AMMENDUMINE ON VAIKNE: neli ühendust, kaheksa samaaegset päringut.
//   Viies EI SAA VIGA — ta OOTAB. Just see teeb ta nii raskesti leitavaks.
const t0 = performance.now();
await Promise.all(Array.from({ length: 8 }, () => pool.query('SELECT SLEEP(0.15)')));
const elapsed = performance.now() - t0;
on('★ 8 päringut 4 ühendusel võtab KAKS vooru, mitte ühe', elapsed > 250, true);
await pool.end();

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);
