
import { Readable } from 'node:stream';

// Ülesanne 3, punkt 1 — sündmuste koondamine linnade kaupa.
export function citySummary() {
  return [
    {
      $group: {
        _id: '$venue.city',
        eventCount: { $sum: 1 },
        avgPrice: { $avg: '$price' },
      },
    },
    {
      $project: {
        _id: 0,
        city: '$_id',
        eventCount: 1,
        avgPrice: { $round: ['$avgPrice', 2] },
      },
    },
    {
      $sort: {
        eventCount: -1,
        city: 1,
      },
    },
  ];
}

// Ülesanne 3, punktid 1–2 — halb etappide järjekord:
// kõigepealt rühmitamine, seejärel filtreerimine.
export const BAD_ORDER = [
  {
    $group: {
      _id: '$venue.city',
      eventCount: { $sum: 1 },
    },
  },
  {
    $match: {
      _id: 'Tartu',
    },
  },
];

// Ülesanne 3, punktid 1–2 — hea etappide järjekord:
// kõigepealt indeksi abil filtreerimine, seejärel rühmitamine.
export const GOOD_ORDER = [
  {
    $match: {
      'venue.city': 'Tartu',
    },
  },
  {
    $group: {
      _id: '$venue.city',
      eventCount: { $sum: 1 },
    },
  },
];

// Ülesanne 3, punkt 5 — kontroll, kas $match asub enne $group etappi.
export function filterIsFirst(pipeline) {
  const matchIndex = pipeline.findIndex((stage) => '$match' in stage);
  const groupIndex = pipeline.findIndex((stage) => '$group' in stage);

  if (matchIndex === -1 || groupIndex === -1) {
    return {
      ok: true,
      reason: 'Pipeline does not require a filter before grouping.',
    };
  }

  if (matchIndex < groupIndex) {
    return {
      ok: true,
      reason: '$match is before $group.',
    };
  }

  return {
    ok: false,
    reason: `${matchIndex + 1}. etapp: $match asub pärast $group etappi.`,
  };
}

// Ülesanne 3, punkt 4 — koondamise etappide nimed nende järjekorras.
export function stageNames(pipeline) {
  return pipeline.map((stage) => Object.keys(stage)[0]);
}

// Ülesanne 3, punkt 3 — sündmuste ja piletite ühendamine $lookup abil.
export function orderSummary() {
  return [
    {
      $lookup: {
        from: 'tickets',
        localField: '_id',
        foreignField: 'eventId',
        as: 'tickets',
      },
    },
    {
      $addFields: {
        sold: { $size: '$tickets' },
      },
    },
    {
      $addFields: {
        free: { $subtract: ['$seatCount', '$sold'] },
      },
    },
    {
      $project: {
        tickets: 0,
      },
    },
  ];
}

// Ülesanne 3, punkt 5 — koondamise meetodi valimine kasutussageduse järgi.
export function adviseSummary({ timesPerDay, accuracyNeed }) {
  if (timesPerDay >= 5000 && accuracyNeed === 'instant') {
    return 'counter in document';
  }

  return 'pipeline';
}

// Ülesanne 3, punkt 6 — MongoDB dokumentide, etapi ja tulemuse piirangud.
export const LIMITS = {
  document: 16 * 1024 * 1024,
  stage: 100 * 1024 * 1024,
  result: 'CURSOR',
};

// Ülesanne 3, punkt 6 — tulemuste lugemine kursorist, mitte toArray() abil.
export async function aggregateAsStream(db, pipeline, onRow) {
  const cursor = db.collection('events').aggregate(pipeline);
  let count = 0;

  try {
    for await (const document of cursor) {
      onRow(document);
      count += 1;
    }
  } finally {
    await cursor.close();
  }

  return count;
}
