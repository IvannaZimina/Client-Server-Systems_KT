
// C10 Ex1 — Dokumendimudel ja andmete kuju

// ── 1. NELI NOSQL PEREKONDA ───

export const FAMILIES = {
  document: {
    example: 'MongoDB, kus andmed salvestatakse BSON-dokumentidena.',
    fits: 'Sobib paindliku struktuuriga andmete ja seotud objektide koos hoidmiseks.',
    bad_for: 'Ei sobi keerulistele mitmele-mitmele seostele ja suurele hulgale ristpäringutele.'
  },

  key_value: {
    example: 'Redis, kus iga väärtus leitakse unikaalse võtme järgi.',
    fits: 'Sobib vahemällu salvestamiseks ja kiireks võtme järgi lugemiseks.',
    bad_for: 'Ei sobi keerulistele päringutele ja väärtuste sisu järgi otsimiseks.'
  },

  column: {
    example: 'Apache Cassandra, kus andmed on jaotatud veerupõhisteks struktuurideks.',
    fits: 'Sobib suurte andmemahtude ja hajutatud kirjutuskoormuse töötlemiseks.',
    bad_for: 'Ei sobi keerulistele JOIN-operatsioonidele ja sageli muutuvatele skeemidele.'
  },

  graph: {
    example: 'Neo4j, kus andmed ja nendevahelised seosed moodustavad graafi.',
    fits: 'Sobib võrgustike, suhete ja mitmetasandiliste seoste uurimiseks.',
    bad_for: 'Ei sobi lihtsate võtme-väärtusandmete massiliseks salvestamiseks.'
  }
};


// ── 2. NORMALISEERITUD JA DENORMALISEERITUD KUJU ───

export function normalized(event, seats) {
  const {
    venueName,
    venueCity,
    ...eventData
  } = event;

  return {
    events: [eventData],
    seats: seats.map((seat) => ({
      ...seat,
      eventId: event.id
    }))
  };
}

export function denormalized(event, seats) {
  const {
    venueId,
    venueName,
    venueCity,
    ...eventData
  } = event;

  return {
    events: [{
      ...eventData,
      venue: {
        name: venueName,
        city: venueCity
      },
      seats: seats.map((seat) => ({ ...seat }))
    }]
  };
}


// ── 3. DUBLEERIMISE KULU ───

export function duplicationCost({
  copies,
  changesPerDay,
  readsPerDay
}) {
  const writes = copies * changesPerDay;
  const savedReads = readsPerDay;
  const worth = writes < savedReads;

  const reason = worth
    ? `Dubleerimine tasub ära: ${writes} kirjutust on vähem kui ${savedReads} säästetud lugemist.`
    : `Dubleerimine ei tasu ära: ${writes} kirjutust on rohkem kui ${savedReads} säästetud lugemist.`;

  return {
    writes,
    savedReads,
    worth,
    reason
  };
}


// ── 4. DOKUMENDI SUURUSE PIIRANG ───

export const DOC_LIMIT = 16 * 1024 * 1024;

export function checkSize(document) {
  const bytes = Buffer.byteLength(JSON.stringify(document), 'utf8');

  return {
    bytes,
    fits: bytes <= DOC_LIMIT
  };
}


// ── 5. KASVAV MASSIIV ────

export function growingArray({
  name,
  growsPerDay,
  bounded
}) {
  if (bounded) {
    return {
      advice: 'can nest',
      reason: `${name} massiiv on piiratud ja selle suurus on kontrollitav.`
    };
  }

  return {
    advice: 'own collection',
    reason: `${name} massiiv kasvab ${growsPerDay} kirje võrra päevas ning vajab eraldi kollektsiooni.`
  };
}


// ── 6. ANDMETE KUJU VALIK ──

export function pickShape({
  readTogether,
  childrenAvg,
  childrenGrow,
  childrenQueriedAlone = false
}) {
  if (childrenGrow || childrenQueriedAlone || childrenAvg > 100) {
    return 'reference';
  }

  if (readTogether) {
    return 'nested';
  }

  return 'reference';
}
