// C09 — ETTE ANTUD. Andmebaasi ühendus proovijooksudele. Seda sa EI kirjuta.
//
// ★ ENNE KUI MIDAGI JOOKSUTAD, PEAB ANDMEBAAS TÖÖTAMA. Kõige lühem tee on
//   Docker — üks käsk, ei mingit paigaldust, ja kustutamine on samuti üks käsk:
//
//   docker run -d --name piletikassa-mysql -e MYSQL_ROOT_PASSWORD=kursus
//              -e MYSQL_DATABASE=piletikassa -p 3309:3306 mysql:8.4
//
//   (üks rida; siin on ta murtud ainult loetavuse pärast)
//
// ★ PORT ON 3309, MITTE 3306. Kui sul on MySQL juba masinasse paigaldatud,
//   istub ta pordil 3306 ja Docker ei saaks käivituda. Sama põhjus, mis pani
//   C05 mõõteserveri pordile 3055: vaikeport on juba kellegi oma.
//
// ★ MySQL EI OLE KOHE VALMIS. Konteiner käivitub sekundiga, aga server
//   initsialiseerib andmekataloogi ~10 sekundit. Kui saad ECONNREFUSED,
//   oota ja proovi uuesti — see EI OLE sinu koodi viga.
import mysql from 'mysql2/promise';

export const SETTINGS = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3309),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? 'kursus',
  database: process.env.DB_NAME ?? 'piletikassa',
  // Vt Ex2: kuupäev sõnena, DECIMAL sõnena. Proovijooks kontrollib, et sinu
  // kood teisendab nad ise — seega peab sisend olema samasugune nagu päris.
  dateStrings: true,
};

/** Kogum proovijooksudele. Ex5 vajab korraga sadat ostjat. */
export const makeTestPool = (add = {}) => mysql.createPool({
  ...SETTINGS, waitForConnections: true, connectionLimit: 30, ...add,
});

export const makeTestConn = () => mysql.createConnection(SETTINGS);

/** Kustutab ostud ja piletid, jättes skeemi ja seemneandmed alles. */
export async function cleanOrders(pool) {
  await pool.query('DELETE FROM ticket');   // enne laps ...
  await pool.query('DELETE FROM orders');     // ... siis vanem
}

// ── LÄHTESTAMINE ────────────────────────────────────────────────────────
// ★ PROOVIJOOKS PEAB ANDMA SAMA VASTUSE IGA KORD. Kui eelmine katse jättis
//   pooleliolevaid ridu, ei mõõda sa enam oma koodi, vaid prahti — ja see
//   on tunduvalt salakavalam kui ilmne viga.
//
// ★ `SET FOREIGN_KEY_CHECKS = 0` on siin lubatud AINULT sellepärast, et me
//   viskame KOGU skeemi ära. Andmete laadimisel oleks ta täpselt see relv,
//   millega vigased viited baasi jõuavad.
export async function reset(conn) {
  const [tables] = await conn.query('SHOW TABLES');
  const names = tables.map((t) => Object.values(t)[0]);
  if (!names.length) return 0;
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const name of names) await conn.query(`DROP TABLE IF EXISTS \`${name}\``);
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  return names.length;
}

// ── PROOVIANDMED JÕUDLUSMÕÕTMISTELE ─────────────────────────────────────
// ★ KOLME REAGA EI SAA JÕUDLUST MÕÕTA. N+1 ja täisskaneering paistavad
//   välja alles siis, kui ridu on tuhandeid. Need kaks abilist teevad
//   ajutise koormuse ja koristavad ta ära.
export const TEST_PREFIX = 'Proovisündmus ';

export async function fillForTest(pool, n = 2000) {
  const [[k]] = await pool.query('SELECT id FROM user ORDER BY id LIMIT 1');
  const [[t]] = await pool.query('SELECT id FROM venue ORDER BY id LIMIT 1');
  const rows = Array.from({ length: n }, (_, i) => [
    t.id, k.id, TEST_PREFIX + String(i).padStart(5, '0'),
    `2026-${String((i % 12) + 1).padStart(2, '0')}-15 19:00:00`,
    (i % 400) + 1, ((i % 90) + 10).toFixed(2),
  ]);
  // ÜKS mitmerealine INSERT, mitte n INSERT-i: 2000 täisringi võtaks minuti.
  await pool.query(
    'INSERT INTO event (venue_id, organizer_id, name, starts_at, seat_count, price) VALUES ?',
    [rows],
  );
  return n;
}

export async function cleanTests(pool) {
  const [t] = await pool.query('DELETE FROM event WHERE name LIKE ?',
                                [TEST_PREFIX + '%']);
  return t.affectedRows;
}

// ★ ESIMENE PÄRING ON ALATI AEGLANE (mõõdetud C06 Ex6-s: 47 ms vs 3 ms).
//   Ühendus tuleb kogumist, TCP-käepigistus ja autentimine käivad ära, ja
//   see aeg satub esimese mõõtmise sisse. Soojenda ENNE kella käivitamist.
export async function warmUp(pool, times = 5) {
  for (let i = 0; i < times; i += 1) await pool.query('SELECT 1');
}

export const clock = async (f) => {
  const t0 = performance.now();
  const rows = await f();
  return { ms: Math.round(performance.now() - t0), rows };
};
