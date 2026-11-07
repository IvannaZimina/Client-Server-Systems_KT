// 1. Sõltuvused ja veatüübid
import {
  ServiceError,
  KIND_TO_CODE,
  serviceErrorHandler,
} from '../materials/service-errors.js';

import { canEdit } from '../materials/permissions.js';

export { ServiceError, KIND_TO_CODE, serviceErrorHandler };


// 2. Teenus ja ärireeglid
export function createEventService(repository, { now } = { now: () => new Date() }) {
  const clock = now ?? (() => new Date());

  async function list({ search = '' } = {}) {
    return repository.findAll({ search });
  }

  async function one(id) {
    const event = await repository.findById(Number(id));

    if (!event) {
      throw new ServiceError('not_found', 'Sündmust ei leitud', { id });
    }

    return event;
  }

  async function buy(id, qty) {
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new ServiceError('invalid', 'Piletite kogus peab olema positiivne täisarv', {
        qty,
      });
    }

    const event = await repository.findById(Number(id));

    if (!event) {
      throw new ServiceError('not_found', 'Sündmust ei leitud', { id });
    }

    if (new Date(clock()).getTime() >= new Date(event.start).getTime()) {
      throw new ServiceError('conflict', 'Sündmus on juba alanud', { id });
    }

    const availableSeats = event.seats - event.sold;

    if (availableSeats < qty) {
      throw new ServiceError('conflict', 'Vabu kohti ei ole piisavalt', {
        availableSeats,
        requested: qty,
      });
    }

    return repository.addOrder({ event: event.id, qty });
  }

  async function update(id, change, user) {
    if (!user) {
      throw new ServiceError('unauthenticated', 'Kasutaja ei ole sisse logitud');
    }

    if (!canEdit(user)) {
      throw new ServiceError('forbidden', 'Kasutajal puudub muutmise õigus');
    }

    const event = await repository.findById(Number(id));

    if (!event) {
      throw new ServiceError('not_found', 'Sündmust ei leitud', { id });
    }

    const updatedEvent = await repository.update(event.id, change);

    if (!updatedEvent) {
      throw new ServiceError('not_found', 'Sündmust ei leitud', { id });
    }

    return updatedEvent;
  }

  return { list, one, buy, update };
}


// 3. Õiguste kontroll teenuses
// Kasutaja puudumine ja muutmisõiguse puudumine annavad erineva veatüübi.


// 4. Repositooriumi kasutamine
// Teenus kasutab ainult repositooriumi meetodeid findAll, findById, update ja addOrder.


// 5. Kontroller ja HTTP-vastused
export function createEventsController(service) {
  return {
    async list(req, res) {
      const events = await service.list(req.query);
      return res.json(events);
    },

    async one(req, res) {
      const event = await service.one(Number(req.params.id));
      return res.json(event);
    },

    async buy(req, res) {
      const order = await service.buy(
        Number(req.params.id),
        req.body.qty,
      );

      return res
        .status(201)
        .location(`/api/orders/${order.id}`)
        .json(order);
    },

    async update(req, res) {
      const user = req.user ?? req.session?.user ?? null;

      const event = await service.update(
        Number(req.params.id),
        req.body,
        user,
      );

      return res.json(event);
    },
  };
}


// 6. Vigade teisendamine HTTP-vastusteks
// ServiceError vealiigid teisendatakse HTTP-koodideks ühes kohas.
// Tundmatud vead antakse edasi järgmisele veakäsitlejale.