
import {
  makeMongo,
  fillMongo,
  clearMongo,
  warmUp,
  clock,
} from './nosql.js';
import { orderSummary } from '../nosql/pipeline.js';

const N = 2000;

function findValues(object, field, result = []) {
  if (object && typeof object === 'object') {
    for (const [key, value] of Object.entries(object)) {
      if (key === field) {
        result.push(value);
      } else if (value && typeof value === 'object') {
        findValues(value, field, result);
      }
    }
  }
  return result;
}

async function measure(db, label) {
  const explain = await db.collection('events')
    .aggregate(orderSummary())
    .explain('executionStats');

  const strategies = [...new Set(findValues(explain, 'strategy'))];
  const docs = findValues(explain, 'totalDocsExamined');
  const keys = findValues(explain, 'totalKeysExamined');

  const timed = await clock(() =>
    db.collection('events').aggregate(orderSummary()).toArray()
  );

  console.log(`\n${label}`);
  console.log('strategy:', strategies.join(', ') || 'не найдена');
  console.log('documents examined:', docs.length ? Math.max(...docs) : 'нет данных');
  console.log('keys examined:', keys.length ? Math.max(...keys) : 'нет данных');
  console.log('time:', timed.ms, 'ms');
  console.log('events:', timed.result.length);
}

const { client, db } = await makeMongo();

try {
  await fillMongo(db, N);
  await warmUp(db);

  const events = await db.collection('events')
    .find({})
    .project({ _id: 1 })
    .limit(N)
    .toArray();

  const tickets = events
    .filter((_, i) => i % 10 === 0)
    .map((event, i) => ({
      _id: `p${i}`,
      eventId: event._id,
    }));

  await db.collection('tickets').insertMany(tickets);

  console.log(`Events: ${N}, tickets: ${tickets.length}`);

  // Esimene mõõtmine — ilma välisvõtme indeksita.
  await measure(db, 'WITHOUT INDEX');

  // Teine mõõtmine — indeksiga.
  await db.collection('tickets').createIndex({ eventId: 1 });
  await measure(db, 'WITH INDEX');
} finally {
  await clearMongo(db);
  await client.close();
}
