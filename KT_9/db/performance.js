
// C09 Ex6 — Jõudluse mõõtmine, indekseid ja päringute optimeerimine.

// listWRONG — vale variant: kõik otsingutulemused tuuakse Node.js mällu
// ja lehekülg valitakse alles pärast päringut.
export async function listWRONG(pool, {
  search = '',
  per = 20,
  page = 1,
} = {}) {
  const [rows] = await pool.execute(
    `SELECT id, name, starts_at, seat_count, price
     FROM event
     WHERE name LIKE ?
     ORDER BY starts_at ASC, id ASC`,
    [`%${search}%`]
  );

  const offset = (page - 1) * per;

  return {
    rows: rows.slice(offset, offset + per),
    total: rows.length,
  };
}

// list — õige variant: filtreerimine ja lehekülje piiramine toimuvad andmebaasis.
export async function list(pool, {
  search = '',
  per = 20,
  page = 1,
} = {}) {
  const pattern = `%${search}%`;

  const [[count]] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM event
     WHERE name LIKE ?`,
    [pattern]
  );

  const offset = (page - 1) * per;

  const [rows] = await pool.execute(
    `SELECT id, name, starts_at, seat_count, price
     FROM event
     WHERE name LIKE ?
     ORDER BY starts_at ASC, id ASC
     LIMIT ? OFFSET ?`,
    [pattern, per, offset]
  );

  return {
    rows,
    total: Number(count.total),
  };
}

// cursorQuery — kursoripõhine lehekülgede lugemine.
// Teisene võti id tagab õige järjestuse ka sama algusajaga sündmustel.
export function cursorQuery({
  afterStart,
  afterId,
  per = 5,
} = {}) {
  if (afterStart == null || afterId == null) {
    return {
      sql: `SELECT id, name, starts_at, seat_count, price
            FROM event
            ORDER BY starts_at ASC, id ASC
            LIMIT ?`,
      param: [per],
    };
  }

  return {
    sql: `SELECT id, name, starts_at, seat_count, price
          FROM event
          WHERE starts_at > ?
             OR (starts_at = ? AND id > ?)
          ORDER BY starts_at ASC, id ASC
          LIMIT ?`,
    param: [afterStart, afterStart, afterId, per],
  };
}

// indexHelps — kontrollib liitindeksi vasakpoolset prefiksit.
export function indexHelps(indexCols, queryCols) {
  let columnsUsed = 0;

  for (let i = 0; i < indexCols.length; i += 1) {
    if (queryCols.includes(indexCols[i])) {
      if (i !== columnsUsed) break;
      columnsUsed += 1;
    } else {
      break;
    }
  }

  return {
    uses: columnsUsed > 0,
    columnsUsed,
    full: columnsUsed === indexCols.length,
  };
}

// indexUsed — kontrollib EXPLAIN-i abil, kas tingimus kasutab indeksit
// otsinguks, mitte kogu tabeli või indeksi läbimiseks.
export async function indexUsed(pool, condition, params = []) {
  const [rows] = await pool.execute(
    `EXPLAIN SELECT id FROM event WHERE ${condition}`,
    params
  );

  const plan = rows[0];
  const type = plan.type;
  const key = plan.key;

  const uses = Boolean(key)
    && !['ALL', 'index'].includes(type);

  return {
    uses,
    key,
    type,
    rows: Number(plan.rows),
  };
}

// explainPlan — hindab EXPLAIN-i tulemust ja annab hoiatused.
export function explainPlan(plan) {
  const warnings = [];
  const type = String(plan.type ?? '').toLowerCase();
  const extra = String(plan.Extra ?? '').toLowerCase();

  if (type === 'all') {
    warnings.push('type=ALL: loetakse kogu tabel läbi');
  }

  if (type === 'index') {
    warnings.push('type=index: loetakse kogu indeks läbi, mitte ei otsita');
  }

  if (!plan.key) {
    warnings.push('päring ei kasuta indeksit');
  }

  if (extra.includes('using filesort')) {
    warnings.push('Using filesort: andmebaas peab tulemuse eraldi sorteerima');
  }

  if (extra.includes('using temporary')) {
    warnings.push('Using temporary: päring kasutab vahetabelit');
  }

  return {
    ok: warnings.length === 0,
    warnings,
  };
}

// COMBINED_QUERY — viis koondnäitajat ühe päringuga.
export const COMBINED_QUERY = `
  SELECT
    COUNT(*) AS events,
    COALESCE(SUM(starts_at > NOW()), 0) AS upcoming,
    COALESCE(SUM(starts_at <= NOW()), 0) AS past,
    COALESCE(SUM(seat_count), 0) AS seats,
    COALESCE(AVG(price), 0) AS average_price
  FROM event
`;
