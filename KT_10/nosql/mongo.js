
import { readSettings, makeClient } from '../materials/settings.js';

// Ülesanne 2, punkt 1 — seadistuste lugemise ja MongoDB kliendi loomise meetodite eksport.
export { readSettings, makeClient };

// Ülesanne 2, punkt 4 — indeksid nime järgi otsimiseks ja kuupäeva järgi sortimiseks.
export const INDEXES = [
  { key: { name: 1 }, name: 'name_1' },
  { key: { startsAt: 1, _id: 1 }, name: 'startsAt_1__id_1' },
];

// Ülesanne 2, punkt 6 — lubatud suhe kontrollitud ja tagastatud dokumentide arvu vahel.
export const RATIO_LIMIT = 5;

// Ülesanne 2, punkt 2 — sündmuse $jsonSchema valideerimisreeglid MongoDB andmebaasis.
export const EVENT_SCHEMA = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['name', 'startsAt', 'price', 'seatCount', 'venue'],
    properties: {
      name: {
        bsonType: 'string',
      },
      startsAt: {
        bsonType: 'date',
      },
      price: {
        bsonType: ['int', 'long', 'double', 'decimal'],
        minimum: 0,
      },
      seatCount: {
        bsonType: 'int',
        minimum: 1,
      },
      venue: {
        bsonType: 'object',
        required: ['name', 'city'],
        properties: {
          name: {
            bsonType: 'string',
          },
          city: {
            bsonType: 'string',
          },
        },
      },
    },
  },
};

// Ülesanne 2, punkt 4 — indeksite loomine events-kogumis.
export async function makeIndexes(db) {
  const collection = db.collection('events');
  const created = [];

  for (const index of INDEXES) {
    const name = await collection.createIndex(index.key, {
      name: index.name,
    });
    created.push(name);
  }

  return collection.listIndexes().toArray();
}

// Ülesanne 2, punkt 8 — objektide tagasilükkamine filtriväärtustena, et vältida operaatorite süstimist.
export function safeEquals(value) {
  if (value !== null && typeof value === 'object') {
    throw new TypeError('Filter value must be a scalar');
  }

  return value;
}

// Ülesanne 2, punkt 4 — regexi erimärkide varjestamine.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Ülesanne 2, punkt 4 — filtrite loomine, sealhulgas algusest ankurdatud regex.
export function buildFilter({
  search,
  priceFrom,
  priceTo,
} = {}) {
  const filter = {};

  if (search !== undefined && search !== null && String(search) !== '') {
    filter.name = {
      $regex: `^${escapeRegex(String(search))}`,
    };
  }

  if (priceFrom !== undefined || priceTo !== undefined) {
    const price = {};

    if (priceFrom !== undefined) {
      price.$gte = safeEquals(priceFrom);
    }

    if (priceTo !== undefined) {
      price.$lte = safeEquals(priceTo);
    }

    filter.price = price;
  }

  return filter;
}

// Ülesanne 2, punkt 4 — sündmuste lehekülgede kaupa pärimine, projektsioon ja sortimine.
export async function list(db, {
  page = 1,
  per = 10,
  search,
  priceFrom,
  priceTo,
} = {}) {
  const filter = buildFilter({ search, priceFrom, priceTo });
  const collection = db.collection('events');

  const rows = await collection
    .find(filter, {
      projection: { seats: 0 },
    })
    .sort({ startsAt: 1, _id: 1 })
    .skip((page - 1) * per)
    .limit(per)
    .toArray();

  const total = await collection.countDocuments(filter);

  return { rows, total };
}

// Ülesanne 2, punkt 2 — kogu loomine range valideerimise ja veateatega.
export async function makeCollectionWithSchema(db, name) {
  await db.createCollection(name, {
    validator: EVENT_SCHEMA,
    validationLevel: 'strict',
    validationAction: 'error',
  });

  return {
    created: true,
    level: 'strict',
    action: 'error',
  };
}

// Ülesanne 2, punktid 5–6 — EXPLAIN executionStats tulemuste analüüs ja päringu hindamine.
export function explainPlan(explanation) {
  const executionStats = explanation?.executionStats;

  // Ilma executionStats andmeteta ei saa päringu jõudlust hinnata.
  if (!executionStats) {
    return {
      gradable: false,
      ok: false,
      stages: [],
      warnings: ['Execution statistics are missing'],
      examined: 0,
      returned: 0,
      ratio: Infinity,
    };
  }

  const stages = [];

  // Päringuplaani etappide kogumine.
  function collectStages(node) {
    if (!node || typeof node !== 'object') return;

    if (typeof node.stage === 'string') {
      stages.push(node.stage);
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === 'stage') continue;

      if (Array.isArray(value)) {
        for (const item of value) collectStages(item);
      } else if (value && typeof value === 'object') {
        collectStages(value);
      }
    }
  }

  collectStages(explanation.queryPlanner?.winningPlan);

  if (stages.length === 0) {
    collectStages(executionStats.executionStages);
  }

  // Läbi vaadatud võtmete ja dokumentide koguarv ning tagastatud dokumentide arv.
  const totalKeysExamined = executionStats.totalKeysExamined ?? 0;
  const totalDocsExamined = executionStats.totalDocsExamined ?? 0;
  const examined = totalKeysExamined + totalDocsExamined;
  const returned = executionStats.nReturned ?? 0;
  const ratio = returned > 0 ? examined / returned : Infinity;

  const warnings = [];

  // Kogu skaneerimine või mälus sortimine näitab ebaefektiivset päringut.
  if (stages.includes('COLLSCAN')) {
    warnings.push('COLLSCAN: collection scan detected');
  }

  if (stages.includes('SORT')) {
    warnings.push('SORT: in-memory sorting detected');
  }

  // Ülesanne 2, punkt 6 — päringu hindamine määratud suhtepiiri alusel.
  if (ratio > RATIO_LIMIT) {
    warnings.push(`Examined/returned ratio exceeds ${RATIO_LIMIT}`);
  }

  const ok =
    stages.includes('IXSCAN') &&
    !stages.includes('COLLSCAN') &&
    !stages.includes('SORT') &&
    ratio <= RATIO_LIMIT;

  return {
    gradable: true,
    ok,
    stages,
    warnings,
    examined,
    returned,
    ratio,
  };
}
