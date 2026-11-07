// C05 Ülesanne 6 — Teenustöötaja ja võrguta pilet
import { shellFirst } from '../materials/shell-first.js';

// 6.1. 
export { shellFirst };

// 6.1.
const VERSION = 'piletikassa-v3';

const SHELL = [
  '/index.html',
  '/app.js',
  '/style.css',
  '/logo.svg',
  '/manifest.webmanifest',
];

// 6.8. 
export function pick(url) {
  const requestUrl =
    typeof url === 'string'
      ? url
      : typeof url?.url === 'string'
        ? url.url
        : url.href;

  const pathname = new URL(
    requestUrl,
    'https://service-worker.local',
  ).pathname;

  if (pathname === '/api/orders') return 'network-only';
  if (pathname === '/api/events') return 'network-first';

  if (/^\/api\/tickets\/[^/]+$/.test(pathname)) {
    return 'stale-while-revalidate';
  }

  return 'shell-first';
}

// 6.6. 
export async function networkFirst(url, {
  cache,
  fetchFn = globalThis.fetch,
  timeout = 5000,
} = {}) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetchFn(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    await cache.put(url, response.clone());

    return response;
  } catch (error) {
    const cached = await cache.match(url);

    if (cached) {
      return cached;
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// 6.7. 
export async function staleWhileRevalidate(url, {
  cache,
  fetchFn = globalThis.fetch,
  awaitBackground = false,
} = {}) {
  const cached = await cache.match(url);

  const refresh = Promise.resolve()
    .then(() => fetchFn(url))
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return cache.put(url, response.clone()).then(() => response);
    })
    .catch((error) => {
      if (!cached) {
        throw error;
      }

      return null;
    });

  if (cached) {
    if (awaitBackground) {
      await refresh;
    } else {
      refresh.catch(() => {});
    }

    return cached;
  }

  return refresh;
}

// 6.1. 
if (globalThis.self?.addEventListener) {
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(VERSION)
        .then((cache) => cache.addAll(SHELL))
        .then(() => self.skipWaiting()),
    );
  });

  // 6.2.
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(
          keys
            .filter((key) => key !== VERSION)
            .map((key) => caches.delete(key)),
        ))
        .then(() => self.clients.claim()),
    );
  });

  // 6.8.
  self.addEventListener('fetch', (event) => {
    const request = event.request;
    const requestUrl = new URL(request.url);

    if (
      globalThis.location?.origin &&
      requestUrl.origin !== globalThis.location.origin
    ) {
      return;
    }

    if (request.method !== 'GET') {
      event.respondWith(fetch(request));
      return;
    }

    const strategy = pick(request);

    event.respondWith(
      (async () => {
        // 6.8. 
        if (strategy === 'network-only') {
          return fetch(request);
        }

        const cache = await caches.open(VERSION);
        const fetchFn = (url, options) => fetch(url, options);

        // 6.6. 
        if (strategy === 'network-first') {
          return networkFirst(request, {
            cache,
            fetchFn,
            timeout: 5000,
          });
        }

        // 6.7. 
        if (strategy === 'stale-while-revalidate') {
          return staleWhileRevalidate(request, {
            cache,
            fetchFn,
          });
        }

        // 6.1. 
        return shellFirst(request, {
          cache,
          fetchFn,
        });
      })(),
    );
  });
}
