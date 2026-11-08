
// rowToEvent(r) — teisendab andmebaasi rea domeeniobjektiks.
export function rowToEvent(r) {
  return {
    id: Number(r.id),
    name: r.name,
    startsAt: r.starts_at,
    seatCount: Number(r.seat_count),
    price: Number(r.price),
    venue: {
      name: r.venue_name,
      city: r.venue_city,
    },
  };
}

// createEventRepo(pool) — SQL elab repositooriumis.
export function createEventRepo(pool) {
  // Otsing, sort ja lehekülg — kõik baasis.
  function buildFilters({ search, startsAt, seatCount, venue } = {}) {
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('e.name LIKE ?');
      params.push(`%${search}%`);
    }

    if (startsAt) {
      conditions.push('e.starts_at = ?');
      params.push(startsAt);
    }

    if (seatCount !== undefined && seatCount !== null && seatCount !== '') {
      conditions.push('e.seat_count = ?');
      params.push(seatCount);
    }

    if (venue) {
      conditions.push('(v.name LIKE ? OR v.address LIKE ?)');
      params.push(`%${venue}%`, `%${venue}%`);
    }

    return {
      where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  // Domeeni väljade valge nimekiri sortimiseks.
  function orderBy(sort, dir) {
    const allowed = {
      id: 'e.id',
      name: 'e.name',
      startsAt: 'e.starts_at',
      seatCount: 'e.seat_count',
      price: 'e.price',
    };

    const column = allowed[sort] ?? 'e.starts_at';
    const direction = ['ASC', 'DESC'].includes(String(dir).toUpperCase())
      ? String(dir).toUpperCase()
      : 'ASC';

    return `ORDER BY ${column} ${direction}, e.id ASC`;
  }

  // findAll({...}) — otsing, sortimine ja lehekülg tehakse andmebaasis.
  async function findAll({
    search,
    startsAt,
    seatCount,
    venue,
    sort = 'startsAt',
    dir = 'ASC',
    page = 1,
    per = 20,
  } = {}) {
    const { where, params } = buildFilters({
      search,
      startsAt,
      seatCount,
      venue,
    });

    const safePage = Math.max(1, Number(page) || 1);
    const safePer = Math.max(1, Math.min(100, Number(per) || 20));
    const offset = (safePage - 1) * safePer;

    const sql = `
      SELECT
        e.id,
        e.name,
        e.starts_at,
        e.seat_count,
        e.price,
        v.name AS venue_name,
        v.address AS venue_city
      FROM event e
      JOIN venue v ON v.id = e.venue_id
      ${where}
      ${orderBy(sort, dir)}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(sql, [...params, safePer, offset]);
    return rows.map(rowToEvent);
  }

  // readTotal({...}) — koguarv loetakse eraldi päringuga.
  async function readTotal(filters = {}) {
    const { where, params } = buildFilters(filters);

    const [rows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM event e
        JOIN venue v ON v.id = e.venue_id
        ${where}
      `,
      params
    );

    return Number(rows[0].total);
  }

  // findById(id) — olematu sündmus annab null.
  async function findById(id) {
    const [rows] = await pool.execute(
      `
        SELECT
          e.id,
          e.name,
          e.starts_at,
          e.seat_count,
          e.price,
          v.name AS venue_name,
          v.address AS venue_city
        FROM event e
        JOIN venue v ON v.id = e.venue_id
        WHERE e.id = ?
      `,
      [id]
    );

    return rows.length ? rowToEvent(rows[0]) : null;
  }

  // add({...}) — lisab sündmuse ja tagastab terve objekti.
  async function add({
    venueId,
    organizerId,
    name,
    startsAt,
    seatCount,
    price,
  }) {
    const [result] = await pool.execute(
      `
        INSERT INTO event
          (venue_id, organizer_id, name, starts_at, seat_count, price)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [venueId, organizerId, name, startsAt, seatCount, price]
    );

    return findById(result.insertId);
  }

  // update(id, change) — osaline muutmine, veerud nimekirjast.
  async function update(id, change = {}) {
    const allowed = {
      name: 'name',
      startsAt: 'starts_at',
      seatCount: 'seat_count',
      price: 'price',
      venueId: 'venue_id',
      organizerId: 'organizer_id',
    };

    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(change)) {
      if (allowed[key]) {
        fields.push(`${allowed[key]} = ?`);
        params.push(value);
      }
    }

    // Tundmatu väli ei jõua SQL-i.
    if (fields.length > 0) {
      await pool.execute(
        `UPDATE event SET ${fields.join(', ')} WHERE id = ?`,
        [...params, id]
      );
    }

    // Sama väärtuse korral tagastatakse samuti objekt.
    // Olematu rea korral tagastatakse null.
    return findById(id);
  }

  // remove(id) — teine kustutamine annab false.
  async function remove(id) {
    const [result] = await pool.execute(
      'DELETE FROM event WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  return {
    findAll,
    readTotal,
    findById,
    add,
    update,
    remove,
  };
}
