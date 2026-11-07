
// C06 Ex4 — Express routes with custom errors

import express from 'express';
import { wrap } from '../materials/express-helpers.js';

import {
  NotFound,
  InvalidInput,
  Conflict
} from './errors.js';

export function eventsRouter(store) {
  const router = express.Router();

  // GET /api/events?search=...
  router.get('/', wrap(async (req, res) => {
    const events = await store.events(req.query.search ?? '');
    res.json(events);
  }));

  // GET /api/events/popular
  router.get('/popular', wrap(async (req, res) => {
    const event = await store.event(2);
    res.json(event ? [event] : []);
  }));

  // GET /api/events/:id
  router.get('/:id', wrap(async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) {
      throw new InvalidInput(
        'Vigane sündmuse ID',
        { id: req.params.id }
      );
    }

    const event = await store.event(Number(req.params.id));

    if (!event) {
      throw new NotFound(
        'Sündmust ei leitud',
        { id: Number(req.params.id) }
      );
    }

    res.json(event);
  }));

  // PATCH /api/events/:id
  router.patch('/:id', wrap(async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) {
      throw new InvalidInput(
        'Vigane sündmuse ID',
        { id: req.params.id }
      );
    }

    const event = await store.updateEvent(
      Number(req.params.id),
      req.body ?? {}
    );

    if (!event) {
      throw new NotFound(
        'Sündmust ei leitud',
        { id: Number(req.params.id) }
      );
    }

    res.json(event);
  }));

  return router;
}

export function ordersRouter(store) {
  const router = express.Router();

  // GET /api/orders
  router.get('/', wrap(async (req, res) => {
    const orders = await store.orders();
    res.json(orders);
  }));

  // POST /api/orders
  router.post('/', wrap(async (req, res) => {
    const body = req.body;

    // Kohustuslike väljade kontroll
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      body.event === undefined ||
      body.qty === undefined
    ) {
      throw new InvalidInput(
        'Puuduvad kohustuslikud väljad: event, qty'
      );
    }

    const eventId = Number(body.event);
    const qty = Number(body.qty);

    // Sisendandmete kontroll
    if (
      !Number.isInteger(eventId) ||
      !Number.isInteger(qty) ||
      qty < 1
    ) {
      throw new InvalidInput(
        'Vigased tellimuse andmed',
        { event: body.event, qty: body.qty }
      );
    }

    const event = await store.event(eventId);

    if (!event) {
      throw new NotFound(
        'Sündmust ei leitud',
        { event: eventId }
      );
    }

    // Vabade kohtade kontroll
    if (event.sold + qty > event.seats) {
      throw new Conflict(
        'Vabu kohti ei ole piisavalt',
        {
          event: eventId,
          requested: qty,
          available: event.seats - event.sold
        }
      );
    }

    const order = await store.addOrder({
      event: eventId,
      qty
    });

    res
      .location(`/api/orders/${order.id}`)
      .status(201)
      .json(order);
  }));

  // DELETE /api/orders/:id
  router.delete('/:id', wrap(async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) {
      throw new InvalidInput(
        'Vigane tellimuse ID',
        { id: req.params.id }
      );
    }

    const removed = await store.removeOrder(Number(req.params.id));

    if (!removed) {
      throw new NotFound(
        'Tellimust ei leitud',
        { id: Number(req.params.id) }
      );
    }

    res.status(204).end();
  }));

  return router;
}
