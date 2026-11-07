
// C06 Ex4 — Express application with custom error handling

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { requestId } from './middleware.js';
import { eventsRouter, ordersRouter } from './routes.js';
import { makeErrorResponse } from './errors.js';

import { logger } from '../materials/logger.js';
import {
  notFound,
  wrap
} from '../materials/express-helpers.js';

import { errorHandler } from '../materials/error-middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(store, { log = console.log } = {}) {
  const app = express();

  // 1. Päringu ID määramine
  app.use(requestId());

  // 2. Päringute logimine
  app.use(logger(log));

  // 3. JSON-päringu keha lugemine
  app.use(express.json({ limit: '10kb' }));

  // 4. Staatilised failid
  app.use(express.static(path.resolve(__dirname, '../public')));

  // 5. Sündmuste marsruudid
  app.use('/api/events', eventsRouter(store));

  // 6. Tellimuste marsruudid
  app.use('/api/orders', ordersRouter(store));

  // 7. Serveri tervisekontroll
  app.get('/api/health', wrap(async (req, res) => {
    res.json({ status: 'ok' });
  }));

  // 8. Tundmatute marsruutide käsitlemine
  app.use(notFound);

  // 9. Üldine veakäsitleja — peab olema viimane
  const response = makeErrorResponse({
    isDev: process.env.NODE_ENV === 'development'
  });

  app.use(errorHandler(response, log));

  return app;
}
