// C05 Exercise 4, points 1-10: cancellation, timeout, retry policy and jitter.
import { waitTime, serverWait } from '../materials/wait-model.js';

export { waitTime, serverWait };

// 4.1.
export function timeoutSignal(ms, outerSignal) {
  const controller = new AbortController();
  // 4.4.
  const timer = setTimeout(() => {
    const error = new Error(`Timeout after ${ms} ms`);
    error.name = 'TimeoutError';
    controller.abort(error);
  }, ms);
  const abort = () => controller.abort(outerSignal.reason);
  outerSignal?.addEventListener('abort', abort, { once: true });
  if (outerSignal?.aborted) controller.abort(outerSignal.reason);
  // 4.2.
  const cleanup = () => {
    clearTimeout(timer);
    outerSignal?.removeEventListener('abort', abort);
  };
  controller.signal.addEventListener('abort', cleanup, { once: true });
  controller.signal.clear = cleanup;
  return controller.signal;
}

// 4.6.
export function shouldRetry(response, error, method = 'GET') {
  if (!['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS'].includes(method.toUpperCase())) {
    return false;
  }

  if (error?.name === 'AbortError') {
    return false;
  }

  if (response) {
    return (response.status >= 500 && response.status <= 599)
      || response.status === 429;
  }

  return error?.name === 'TimeoutError' || error instanceof TypeError;
}

// 4.5.
async function defaultWait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// 4.7.
export async function requestWithRetry(url, options = {}) {
  const {
    fetchFn = globalThis.fetch,
    attempts = 3,
    timeout = 8000,
    wait = defaultWait,
    jitter = 100,
    signal: outerSignal,
    method = 'GET',
    ...fetchOptions
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response;
    let signal;
    let retryDelay;

    try {
      signal = timeoutSignal(timeout, outerSignal);

      response = await fetchFn(url, {
        ...fetchOptions,
        method,
        signal
      });
    } catch (error) {
      lastError = error;

      if (
        outerSignal?.aborted ||
        !shouldRetry(null, error, method) ||
        attempt === attempts
      ) {
        throw error;
      }

      retryDelay = waitTime(attempt, { jitter });
    } finally {
      signal?.clear();
    }

    if (response) {
      if (
        !shouldRetry(response, null, method) ||
        attempt === attempts
      ) {
        return { response, attempts: attempt };
      }

      retryDelay = serverWait(response) ?? waitTime(attempt, { jitter });
    }

    await wait(retryDelay);

    if (outerSignal?.aborted) {
      throw outerSignal.reason;
    }
  }

  throw lastError;
}