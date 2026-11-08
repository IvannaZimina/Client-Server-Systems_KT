
import {
  makeTestPool,
  fillForTest,
  cleanTests,
  warmUp,
} from './db.js';

const pool = makeTestPool();

try {
  await cleanTests(pool);
  await fillForTest(pool, 2000);
  await warmUp(pool);

  const queries = [
    ['LIKE', "SELECT id FROM event WHERE name LIKE '%kontsert%'"],
    ['RANGE + ORDER BY', "SELECT id FROM event WHERE starts_at > '2026-06-01' ORDER BY starts_at LIMIT 10"],
    ['ORDER BY price', 'SELECT id FROM event ORDER BY price LIMIT 10'],
    ['YEAR', 'SELECT id FROM event WHERE YEAR(starts_at) = 2026'],
    ['MONTH', 'SELECT id FROM event WHERE MONTH(starts_at) = 3'],
    ['DATE RANGE', "SELECT id FROM event WHERE starts_at >= '2026-03-01' AND starts_at < '2026-04-01'"],
    ['EQUALITY', "SELECT id FROM event WHERE starts_at = '2026-03-15 19:00:00'"],
    ['GREATER THAN', "SELECT id FROM event WHERE starts_at > '2026-06-01'"],
  ];

  for (const [name, sql] of queries) {
    const [rows] = await pool.query('EXPLAIN ' + sql);
    const plan = rows[0];

    console.log(
      `${name}: type=${plan.type}, key=${plan.key}, rows=${plan.rows}, Extra=${plan.Extra}`
    );
  }
} finally {
  await cleanTests(pool);
  await pool.end();
}
