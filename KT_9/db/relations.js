
import { eventsJoin } from './events-join.js';

export { eventsJoin };

// eventsN1(pool, counter) — üks päring sündmuste jaoks ja üks iga sündmuse jaoks.
export async function eventsN1(pool, counter) {
  const [events] = await pool.execute(`
    SELECT id, name, seat_count
    FROM event
    ORDER BY id
  `);
  counter.queries += 1;

  const rows = [];

  for (const event of events) {
    const [counts] = await pool.execute(`
      SELECT COUNT(t.id) AS sold
      FROM seat s
      LEFT JOIN ticket t ON t.seat_id = s.id
      WHERE s.event_id = ?
    `, [event.id]);
    counter.queries += 1;

    const sold = Number(counts[0].sold);

    rows.push({
      ...event,
      seat_count: Number(event.seat_count),
      sold,
      free: Number(event.seat_count) - sold,
    });
  }

  return rows;
}

// eventsTwoQueries(pool, counter) — sündmused ja müüdud piletid kahe päringuga.
export async function eventsTwoQueries(pool, counter) {
  const [events] = await pool.execute(`
    SELECT id, name, seat_count
    FROM event
    ORDER BY id
  `);
  counter.queries += 1;

  const [counts] = await pool.execute(`
    SELECT e.id, COUNT(t.id) AS sold
    FROM event e
    LEFT JOIN seat s ON s.event_id = e.id
    LEFT JOIN ticket t ON t.seat_id = s.id
    GROUP BY e.id
  `);
  counter.queries += 1;

  const soldByEvent = new Map(
    counts.map((row) => [Number(row.id), Number(row.sold)])
  );

  const rows = events.map((event) => {
    const sold = soldByEvent.get(Number(event.id)) ?? 0;

    return {
      ...event,
      seat_count: Number(event.seat_count),
      sold,
      free: Number(event.seat_count) - sold,
    };
  });

  return rows;
}

// bloat(pool, userId) — kaks last ühelt vanemalt ja COUNT-i paisumine.
export async function bloat(pool, userId) {
  const [rows] = await pool.execute(`
    SELECT
      COUNT(*) AS counted,
      COUNT(DISTINCT o.id) AS orders,
      COUNT(DISTINCT e.id) AS events
    FROM user u
    LEFT JOIN orders o ON o.user_id = u.id
    LEFT JOIN event e ON e.organizer_id = u.id
    WHERE u.id = ?
  `, [userId]);

  return {
    counted: Number(rows[0].counted),
    orders: Number(rows[0].orders),
    events: Number(rows[0].events),
  };
}

// suggestStrategy() — valib seose tüübi järgi sobiva päringustrateegia.
export function suggestStrategy({
  relationKind,
  parentFields = 0,
  childrenAvg = 0,
} = {}) {
  if (relationKind === 'aggregate') {
    return 'join';
  }

  if (relationKind === 'one_to_one') {
    return 'join';
  }

  if (relationKind === 'one_to_many') {
    if (parentFields >= 10 && childrenAvg >= 50) {
      return 'two_queries';
    }

    if (childrenAvg <= 2) {
      return 'join';
    }

    return 'two_queries';
  }

  return 'two_queries';
}

// CHOICE — N+1 sobib ainult väikese andmemahu korral.
export const CHOICE = {
  n_plus_1: {
    fits: 'MITTE KUNAGI',
  },
};
