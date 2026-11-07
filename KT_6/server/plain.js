// C06 Ex2 — Puhas HTTP-server ja keskkond

import http from 'node:http';
import { readBody } from '../materials/body-reader.js';
import { match } from '../materials/route-match.js';
import { json } from '../materials/json-response.js';

// 1. Keskkonnamuutujate kontroll
export function readConfig(env = process.env) {
  const required = ['DB_URL', 'SESSION_SECRET'];

  const missing = required.filter(
    (key) => typeof env[key] !== 'string' || env[key].trim() === ''
  );

  if (missing.length > 0) {
    throw new Error(
      `Puuduvad keskkonnamuutujad: ${missing.join(', ')}`
    );
  }

  const portValue = env.PORT ?? '3006';
  const port = Number(portValue);

  if (
    typeof portValue !== 'string' ||
    portValue.trim() === '' ||
    !/^\d+$/.test(portValue) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new RangeError('Vigane PORT');
  }

  return {
    databaseUrl: env.DB_URL,
    sessionKey: env.SESSION_SECRET,
    port,
    kind: env.NODE_ENV || 'development'
  };
}

// 2. Saladuste peitmine logides
export function configForLog(config) {
  return {
    databaseUrl: '***',
    sessionKey: '***',
    port: config.port,
    kind: config.kind
  };
}

// 3. HTTP-päringute käsitleja
export function createHandler(data) {
  return async function handleRequest(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;

    // GET /api/events — sündmuste nimekiri
    if (req.method === 'GET' && pathname === '/api/events') {
      json(res, 200, data);
      return;
    }

    // GET /api/events/:id — ühe sündmuse andmed
    const eventParams = match('/api/events/:id', pathname);

    if (req.method === 'GET' && eventParams) {
      const event = data.find(
        (item) => String(item.id) === eventParams.id
      );

      if (!event) {
        json(res, 404, { error: 'Sündmust ei leitud' });
        return;
      }

      json(res, 200, event);
      return;
    }

    // POST /api/orders — osaline tellimuse loomine
    if (req.method === 'POST' && pathname === '/api/orders') {
      let body;

      try {
        const raw = await readBody(req, { limit: 1_000_000 });
        body = JSON.parse(raw);
      } catch (error) {
        if (error.code === 413) {
          if (!req.destroyed && !res.destroyed) {
            json(res, 413, { error: 'Keha liiga suur' });
          }
          return;
        }

        if (error instanceof SyntaxError) {
          json(res, 400, { error: 'Vigane JSON' });
          return;
        }

        throw error;
      }

      // Kohustuslike väljade kontroll
      if (
        !body ||
        typeof body !== 'object' ||
        Array.isArray(body) ||
        body.event === undefined ||
        body.qty === undefined
      ) {
        json(res, 422, {
          error: 'Puuduvad kohustuslikud väljad: event, qty'
        });
        return;
      }

      const eventId = Number(body.event);
      const qty = Number(body.qty);

      // Tellimuse andmete kontroll
      if (
        !Number.isInteger(eventId) ||
        !Number.isInteger(qty) ||
        qty < 1
      ) {
        json(res, 422, {
          error: 'Vigased tellimuse andmed'
        });
        return;
      }

      // Sündmuse olemasolu kontroll
      const event = data.find(
        (item) => item.id === eventId
      );

      if (!event) {
        json(res, 404, {
          error: 'Sündmust ei leitud'
        });
        return;
      }

      // Vabade kohtade kontroll
      if (event.sold + qty > event.seats) {
        json(res, 422, {
          error: 'Vabu kohti ei ole piisavalt'
        });
        return;
      }

      // Tellimuse loomine
      const order = {
        id: 9001,
        event: eventId,
        qty
      };

      json(res, 201, order, {
        Location: '/api/orders/9001'
      });

      return;
    }

    // 404 — tundmatu marsruut
    json(res, 404, {
      error: 'Marsruuti ei leitud'
    });
  };
}

// 4. HTTP-serveri loomine ja vigade käsitlemine
export function makeServer(data) {
  const handler = createHandler(data);

  return http.createServer((req, res) => {
    handler(req, res).catch((error) => {
      console.error('Päringu viga:', error.message);

      if (res.destroyed || req.destroyed) {
        return;
      }

      if (res.headersSent) {
        res.destroy();
        return;
      }

      json(res, 500, {
        error: 'Serveri sisemine viga'
      });
    });
  });
}

// Marsruudi sobitamise funktsiooni eksport
export { match };