
import { retryOnDeadlock, orderLocks } from '../materials/retry.js';

// C09 — Tehingute haldamine piletite ostmisel.
// Fail tagab kohtade turvalise ostmise, lukustamise ja vigade käsitlemise.

export { orderLocks };

// SQL-vigade teisendamine rakenduse tasemel vigadeks.
export const ERROR_CODES = {
  ER_DUP_ENTRY: { http: 409, kind: 'duplicate' },
  ER_NO_REFERENCED_ROW_2: { http: 422, kind: 'invalid_reference' },
  ER_ROW_IS_REFERENCED_2: { http: 409, kind: 'reference_in_use' },
  ER_CHECK_CONSTRAINT_VIOLATED: { http: 422, kind: 'validation' },
  ER_DATA_TOO_LONG: { http: 422, kind: 'validation' },
  ER_LOCK_DEADLOCK: { http: 409, kind: 'deadlock' },
  ER_LOCK_WAIT_TIMEOUT: { http: 409, kind: 'deadlock' },
};

export function translateError(err) {
  const code = err?.code ?? 'SOMETHING_ELSE';

  if (code === 'ER_DUP_ENTRY') {
    const message = String(err?.sqlMessage ?? err?.message ?? '');

    let field = 'unknown';

    if (/uq_ticket_seat|seat_id/i.test(message)) {
      field = 'seat';
    } else if (/uq_user_email|email/i.test(message)) {
      field = 'email';
    }

    return {
      kind: 'duplicate',
      http: 409,
      field,
      message: field === 'seat'
        ? 'koht on müüdud'
        : 'väärtus on juba kasutusel',
      retryable: false,
    };
  }

  const known = ERROR_CODES[code];

  if (known) {
    return {
      kind: known.kind,
      http: known.http,
      field: null,
      message: known.kind === 'deadlock'
        ? 'tehingu lukustuskonflikt'
        : 'andmebaasi piirangu rikkumine',
      retryable: known.kind === 'deadlock',
    };
  }

  return {
    kind: 'internal',
    http: 500,
    field: null,
    message: 'serveri sisemine viga',
    retryable: false,
  };
}

// Vale näide: koha saadavust kontrollitakse väljaspool tehingut.
// Mitu ostjat võivad korraga sama koha vabaks lugeda.
export async function buyWRONG(pool, { userId, seatId }) {
  const [sold] = await pool.execute(
    'SELECT id FROM ticket WHERE seat_id = ?',
    [seatId]
  );

  if (sold.length > 0) {
    return { ok: false, reason: 'koht on müüdud' };
  }

  const [order] = await pool.execute(
    'INSERT INTO orders (user_id, state) VALUES (?, ?)',
    [userId, 'paid']
  );

  const [ticket] = await pool.execute(
    'INSERT INTO ticket (order_id, seat_id) VALUES (?, ?)',
    [order.insertId, seatId]
  );

  return {
    ok: true,
    orderId: order.insertId,
    ticketId: ticket.insertId,
  };
}

// Õige ost: koht lukustatakse ja kõik toimingud tehakse ühes tehingus.
export async function buy(pool, { userId, seatId }) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [seats] = await conn.execute(
      'SELECT id FROM seat WHERE id = ? FOR UPDATE',
      [seatId]
    );

    if (seats.length === 0) {
      await conn.rollback();
      return { ok: false, reason: 'kohta ei leitud' };
    }

    const [sold] = await conn.execute(
      'SELECT id FROM ticket WHERE seat_id = ?',
      [seatId]
    );

    if (sold.length > 0) {
      await conn.rollback();
      return { ok: false, reason: 'koht on müüdud' };
    }

    const [order] = await conn.execute(
      'INSERT INTO orders (user_id, state) VALUES (?, ?)',
      [userId, 'paid']
    );

    const [ticket] = await conn.execute(
      'INSERT INTO ticket (order_id, seat_id) VALUES (?, ?)',
      [order.insertId, seatId]
    );

    await conn.commit();

    return {
      ok: true,
      orderId: order.insertId,
      ticketId: ticket.insertId,
    };
  } catch (err) {
    await conn.rollback().catch(() => {});

    const translated = translateError(err);

    if (translated.kind === 'duplicate' && translated.field === 'seat') {
      return { ok: false, reason: 'koht on müüdud' };
    }

    throw err;
  } finally {
    conn.release();
  }
}

// Mitme koha ost toimub ühe tervikliku tehinguna.
// Lukud võetakse alati kasvavas ID-järjekorras.
// Ummikseisu korral korratakse kogu tehingut.
export async function buyMany(pool, { userId, seatIds }) {
  const ids = orderLocks(seatIds);

  if (ids.length === 0) {
    return { ok: false, reason: 'kohti ei valitud' };
  }

  return retryOnDeadlock(async () => {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Kõik kohad lukustatakse samas järjekorras.
      for (const seatId of ids) {
        const [seats] = await conn.execute(
          'SELECT id FROM seat WHERE id = ? FOR UPDATE',
          [seatId]
        );

        if (seats.length === 0) {
          await conn.rollback();
          return { ok: false, reason: 'kohta ei leitud' };
        }
      }

      // Kontrollime, kas mõni koht on juba müüdud.
      // Kohtade lukud kaitsevad samaaegsete ostude eest.
      const placeholders = ids.map(() => '?').join(', ');
      const [sold] = await conn.execute(
        `SELECT seat_id FROM ticket WHERE seat_id IN (${placeholders})`,
        ids
      );

      if (sold.length > 0) {
        await conn.rollback();
        return { ok: false, reason: 'koht on müüdud' };
      }

      const [order] = await conn.execute(
        'INSERT INTO orders (user_id, state) VALUES (?, ?)',
        [userId, 'paid']
      );

      for (const seatId of ids) {
        await conn.execute(
          'INSERT INTO ticket (order_id, seat_id) VALUES (?, ?)',
          [order.insertId, seatId]
        );
      }

      await conn.commit();

      return {
        ok: true,
        orderId: order.insertId,
        seatIds: ids,
      };
    } catch (err) {
      await conn.rollback().catch(() => {});
      throw err;
    } finally {
      conn.release();
    }
  }, {
    retryable: (err) => translateError(err).retryable,
  });
}

// Tehingu piirid: HTTP-päringud ja välised teenused jäävad tehingust välja.
export const TX_BEGIN = {
  outside: [
    'HTTP-päring',
    'kasutaja autentimine',
    'maksefirma vastus',
  ].join('; '),
  inside: [
    'SELECT ... FOR UPDATE',
    'koha saadavuse kontroll',
    'tellimuse loomine',
    'pileti loomine',
  ].join('; '),
};
