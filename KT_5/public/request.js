// C05 Exercise 3, points 1-10: response parsing, four UI states and request deduplication.
import { readBody } from '../materials/read-response.js';
import { errorToState as errorText } from '../materials/error-text.js';

// 3.1.
export async function readResponse(response) {
  try {
    return await readBody(response);
  } catch (error) {
    if (error.badBody) {
      error.kind = 'format';
    } else if (error.status) {
      error.kind =
        error.status >= 500 || error.status === 429
          ? 'server'
          : 'client';
    }

    throw error;
  }
}

// 3.6.
export function stateFromData(rows) {
  if (!Array.isArray(rows)) return { state: 'err', message: 'Server saatis vale andmekuju.' };
  if (rows.length === 0) {
    return { state: 'empty', message: 'Ükski sündmus ei vasta otsingule.' };
  }
  return { state: 'data', data: rows };
}

// 3.4.
export function errorToState(error) {
  return errorText(error);
}

// 3.7.
export function createClient({ fetchFn = globalThis.fetch, url = '/api/events' } = {}) {
  let inFlight = null;
  return {
    events() {
      // 3.8.
      if (inFlight) return inFlight;
      inFlight = Promise.resolve()
        .then(() => fetchFn(url))
        .then(readResponse)
        .then(stateFromData)
        .catch((error) => errorToState(error))
        .finally(() => { inFlight = null; });
      // 3.9.
      return inFlight;
    },
    inFlightCount: () => (inFlight ? 1 : 0),
  };
}
