
// C10 Ex4 — Firestore: mudel ja kuulajad

// ── 1. ANDMEMUDEL JA RAJAD ───

// Firestore'i dokumendi maksimaalne suurus: 1 MiB.
export const DOC_LIMIT = 1024 * 1024;

// Kollektsioonide ja dokumentide teed.
export const PATHS = {
  events: 'events',
  seats: (eventId) => `events/${eventId}/seats`,
  seat: (eventId, row, number) =>
    `events/${eventId}/seats/${seatId(row, number)}`,
};

// Koha ID tuletatakse reast ja numbrist.
export function seatId(row, number) {
  return `r${row}n${number}`;
}

// ── 2. INDEKSID ────

// Indeksite näited Firestore'i päringute jaoks.
export const INDEXES = [
  {
    collection: 'events',
    fields: ['venue.city', 'startsAt'],
  },
  {
    collection: 'events',
    fields: ['price', 'startsAt'],
  },
];

// Koostab vajaliku indeksi väljade järjekorra.
export function neededIndex({
  collection,
  equalities = [],
  inequalities = [],
  order = [],
}) {
  const fields = [...new Set([
    ...equalities,
    ...inequalities,
    ...order,
  ])];

  return {
    composite: fields.length > 1,
    fields,
  };
}

// ── 3. FIRESTORE'I PIIRANGUD ───

export const CANNOT_DO = [
  'JOIN: dokumente ei ühendata automaatselt nagu SQL-is.',
  'FULL TEXT: täistekstiotsing vajab välist otsinguteenust.',
  'ARBITRARY AGGREGATION: keerulised koondpäringud on piiratud.',
  'SUBCOLLECTION: alamkollektsiooni ei tagastata koos vanemdokumendiga.',
  'DOCUMENT SIZE: ühe dokumendi suurus on piiratud 1 MiB-ga.',
  'COLLECTION GROUP: kõigi alamkollektsioonide lugemiseks tuleb kasutada collectionGroup-päringut.',
];


// ── 4. DOKUMENTIDE LOOMINE JA LUGEMINE ───

// Loob sündmuse eraldi dokumendina.
export async function makeEvent(db, eventId, data) {
  await db.collection(PATHS.events).doc(eventId).set(data);
}

// Loeb sündmuse dokumendi.
export async function readEvent(db, eventId) {
  const snapshot = await db.collection(PATHS.events).doc(eventId).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

// Loeb kõik dokumendid antud päringust või kollektsioonist.
export async function readAll(query) {
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Loob sündmuse alamkollektsiooni kohad.
export async function makeSeats(db, eventId, rows, columns) {
  const batch = db.batch();
  const paths = [];

  for (let row = 1; row <= rows; row += 1) {
    for (let number = 1; number <= columns; number += 1) {
      const path = PATHS.seat(eventId, row, number);
      const ref = db.doc(path);

      batch.set(ref, {
        row,
        number,
        sold: false,
        ticketId: null,
      });

      paths.push(path);
    }
  }

  await batch.commit();
  return paths;
}

// Märgib koha müüdud kohaks.
// update() ei loo puuduvat dokumenti.
export async function markSold(db, eventId, row, number, ticketId) {
  const ref = db.doc(PATHS.seat(eventId, row, number));

  await ref.update({
    sold: true,
    ticketId,
  });
}

// ── 5. KOLLEKTSIOONIRÜHM ────────────────────────────────────────────

// Loeb vabade kohtade dokumendid kõigi sündmuste alamkollektsioonidest.
export function allFreeSeats(db, { per = 50 } = {}) {
  return db.collectionGroup('seats')
    .where('sold', '==', false)
    .limit(per);
}

// ── 6. MUUTUSTE KUULAJA ───

// Kuulab ühe sündmuse vabade kohtade muutusi.
export function watchFreeSeats(db, eventId, { onChange, err }) {
  const query = db.collection(PATHS.seats(eventId))
    .where('sold', '==', false);

  return query.onSnapshot(
    (snapshot) => {
      const changes = snapshot.docChanges().map((change) => ({
        kind: change.type,
        id: change.doc.id,
        ...change.doc.data(),
      }));

      onChange({
        free: snapshot.size,
        changes,
      });
    },
    (error) => {
      if (err) err(error);
    },
  );
}
