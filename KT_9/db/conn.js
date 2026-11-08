
import { createPool } from 'mysql2/promise';

// readSettings — ekspordi edasi materials/settings.js-ist.
export { readSettings } from '../materials/settings.js';

// Kogumi suurus, ühenduste ootamine, järjekorra piir ja kuupäevade tekstina tagastamine.
export function makePool(settings, { size = 10 } = {}) {
  return createPool({
    ...settings,
    waitForConnections: true,
    connectionLimit: size,
    queueLimit: 0,
    dateStrings: true,
  });
}

// readEvent(pool, id) — execute, mitte query.
export async function readEvent(pool, id) {
  const [rows] = await pool.execute(
    'SELECT * FROM event WHERE id = ?',
    [id]
  );

  return rows[0] ?? null;
}

// SORTABLE — valge nimekiri: ORDER BY EI OLE parameeter.
// tundmatu väli VISKAB; tundmatu suund võtab vaikeväärtuse.
export function buildOrderBy(field, direction = 'ASC') {
  const allowedFields = ['id', 'name', 'price'];

  if (!allowedFields.includes(field)) {
    throw new RangeError(`Tundmatu sorteerimisväli: ${field}`);
  }

  const safeDirection = ['ASC', 'DESC'].includes(
    String(direction).toUpperCase()
  )
    ? String(direction).toUpperCase()
    : 'ASC';

  return `ORDER BY ${field} ${safeDirection}, id ASC`;
}

// inClause(col, vals) — terve tingimus; tühi -> 1 = 0, MITTE IN ().
export function inClause(col, vals) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col)) {
    throw new RangeError('Vigane veeru nimi');
  }

  if (!Array.isArray(vals)) {
    throw new TypeError('vals peab olema massiiv');
  }

  if (vals.length === 0) {
    return { sql: '1 = 0', param: [] };
  }

  const placeholders = vals.map(() => '?').join(', ');

  return {
    sql: `${col} IN (${placeholders})`,
    param: vals,
  };
}

// updateResult(t) — affectedRows ja changedRows on ERI asjad.
export function updateResult(result) {
  return {
    found: result.affectedRows,
    changed: result.changedRows,
    existing: result.affectedRows > 0,
  };
}
