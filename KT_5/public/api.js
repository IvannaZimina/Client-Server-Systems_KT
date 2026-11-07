// C05 Exercise 5, points 1-10: one API boundary, error normalization and data mapping.
import { ApiError as MaterialApiError } from '../materials/api-error.js';
import { timeoutSignal } from './abort.js';

export class ApiError extends MaterialApiError {}

// 5.1.
export function toApiError(error) {
  if (error instanceof ApiError) return error;

  const reason = error ?? null;
  const message = error?.message ?? 'Unknown API error';

  // 5.2.
  if (error?.name === 'AbortError') {
    return new ApiError(message, {
      kind: 'abort',
      reason,
    });
  }

  if (error?.name === 'TimeoutError') {
    return new ApiError(message, {
      kind: 'timeout',
      reason,
    });
  }

  if (error?.kind) {
    return new ApiError(message, {
      kind: error.kind,
      status: error.status ?? null,
      reason,
    });
  }

  if (error instanceof TypeError) {
    return new ApiError(message, {
      kind: 'network',
      reason,
    });
  }

  return new ApiError(message, {
    kind: 'format',
    status: error?.status ?? null,
    reason,
  });
}

// 5.6.
export function toEvent(raw) {
  const event = { ...raw, start: new Date(raw.start) };
  event.free = raw.seats - raw.sold;
  event.soldOut = event.free <= 0;
  delete event.seats;
  delete event.sold;
  return event;
}

function parseBody(response) {
  if (response.status === 204) return Promise.resolve(null);
  return response.json();
}

// 5.4.
export function makeApi({
  fetchFn = globalThis.fetch,
  base = '/api',
  timeout = 8000,
} = {}) {
  async function ask(path, options = {}) {
    const { signal: outerSignal, ...requestOptions } = options;
    const signal = timeoutSignal(timeout, outerSignal);

    try {
      // 5.5.
      const response = await fetchFn(base + path, {
        ...requestOptions,
        signal,
        headers: {
          Accept: 'application/json',
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...options.headers,
        },
      });

      if (!response.ok) {
        // 5.7.
        const body = await response.json().catch(() => ({}));
        const kind =
          response.status >= 500 || response.status === 429
            ? 'server'
            : 'client';

        throw new ApiError(body.err ?? `HTTP ${response.status}`, {
          kind,
          status: response.status,
        });
      }

      // 5.8.
      return await parseBody(response);
    } catch (error) {
      throw toApiError(error);
    } finally {
      signal.clear();
    }
  }

  return {
    async events(search = '', options = {}) {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      return (await ask(`/events${query}`, options)).map(toEvent);
    },

    async event(id, options = {}) {
      return toEvent(await ask(`/events/${id}`, options));
    },

    seatmap(id, options = {}) {
      return ask(`/events/${id}/seatmap`, options);
    },

    buyTickets(event, qty, options = {}) {
      return ask('/orders', {
        ...options,
        method: 'POST',
        body: JSON.stringify({ event, qty }),
      });
    },
  };
}

// 5.9.
export const RENDER_MODES = {
  server: { roundTrips: 1, searchEngine: 'excellent: complete HTML' },
  client: { roundTrips: 2, searchEngine: 'limited: shell first' },
  api_spa: { roundTrips: 3, searchEngine: 'depends on prerendering' },
};

// 5.9.
export function renderMode({ html, jsonRequests }) {
  const hasScript = /<script\b/i.test(html);
  if (!hasScript && jsonRequests === 0) return 'server';
  if (hasScript && jsonRequests === 0) return 'client';
  return 'api_spa';
}
