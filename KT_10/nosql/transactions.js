
// C10 Ex5 — Tehingud ja pakktöötlus

// ── 1. VALE OST: LUGEMINE JA KIRJUTAMINE ERALDI ───

// Näitab võistlusolukorda: mitu ostjat võivad sama koha vabaks lugeda.
export async function buyWRONG(db, { eventId, row, number, userId }) {
  const events = db.collection('events');

  const event = await events.findOne({ _id: eventId });
  const seat = event?.seats.find(
    (item) => item.row === row && item.number === number,
  );

  if (!seat) {
    return { ok: false, reason: 'kohta ei leitud' };
  }

  if (seat.sold) {
    return { ok: false, reason: 'koht on müüdud' };
  }

  // Viivitus toob võistlusolukorra selgemalt esile.
  await new Promise((resolve) => setTimeout(resolve, 25));

  // VIGA: kirjutamisel ei kontrollita enam, kas koht on vaba.
  // Kõik ostjad, kes lugesid koha vabaks, suurendavad loendurit.
  await events.updateOne(
    {
      _id: eventId,
      seats: { $elemMatch: { row, number } },
    },
    {
      $set: {
        'seats.$.sold': true,
        'seats.$.userId': userId,
      },
      $inc: { soldTotal: 1 },
    },
  );

  return { ok: true };
}

// ── 2. ÕIGE OST: TINGIMUS ON FILTRIS ────

// Ühe dokumendi muutmine on MongoDB-s atomaarne.
export async function buySeat(db, { eventId, row, number, userId }) {
  const result = await db.collection('events').updateOne(
    {
      _id: eventId,
      seats: { $elemMatch: { row, number, sold: false } },
    },
    {
      $set: {
        'seats.$.sold': true,
        'seats.$.userId': userId,
      },
      $inc: { soldTotal: 1 },
    },
  );

  if (result.modifiedCount === 1) {
    return { ok: true };
  }

  return { ok: false, reason: 'koht on müüdud' };
}

// ── 3. KAHE KOHA OST: TEHING ────

// Kõik kohad ja ostudokument salvestatakse ühe tehinguna.
export async function buyInTwoPlaces(client, db, {
  eventId,
  seats,
  userId,
}) {
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      for (const seat of seats) {
        const result = await db.collection('events').updateOne(
          {
            _id: eventId,
            seats: {
              $elemMatch: {
                row: seat.row,
                number: seat.number,
                sold: false,
              },
            },
          },
          {
            $set: {
              'seats.$.sold': true,
              'seats.$.userId': userId,
            },
            $inc: { soldTotal: 1 },
          },
          { session },
        );

        if (result.modifiedCount !== 1) {
          throw new Error('koht on müüdud');
        }
      }

      await db.collection('orders').insertOne(
        {
          eventId,
          userId,
          seats,
          createdAt: new Date(),
        },
        { session },
      );
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  } finally {
    await session.endSession();
  }
}

// ── 4. PAKKTOIMING ─────

// BulkWrite muudab mitu dokumenti, kuid ei paku nende vahel rollback'i.
export async function batchUpdate(db, items) {
  const operations = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id },
      update: { $set: item.set },
    },
  }));

  const result = await db.collection('events').bulkWrite(
    operations,
    { ordered: false },
  );

  return {
    match: result.matchedCount,
    errors: 0,
  };
}

// ── 5. PAKK VÕI TEHING ───

export const BATCH_VS_TX = {
  batch: {
    atomic: 'Iga dokumendi muudatus on atomaarne',
    rollback: 'EI OLE',
  },
  transaction: {
    atomic: 'Kõik muudatused koos',
    rollback: 'ON',
  },
};

// ── 6. CAP JA LÕPPKOOSKÕLA ───

export const CAP = {
  P: 'EI OLE valik: partitsiooni korral tuleb võrguühenduse kadumisel valida saadavuse ja kooskõla vahel.',
};

export function allowsEventual({ what, lagOk }) {
  if (what === 'free seats') {
    return {
      allows: false,
      reason: 'Vabade kohtade arvu põhjal tehakse OTSUS.',
    };
  }

  if (what === 'views') {
    return {
      allows: true,
      reason: 'Vaatamiste loendur talub ajutist erinevust.',
    };
  }

  return {
    allows: Boolean(lagOk),
    reason: lagOk
      ? 'Ajutine erinevus on lubatud.'
      : 'Lõppkooskõla ei sobi selle andme jaoks.',
  };
}
