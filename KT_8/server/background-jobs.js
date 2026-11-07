
// 1–5. Idempotentsusvõtme haldus: uus, käib, kordus ja konflikt.
export function createIdempotency({ ttl = 60000, clock = Date.now } = {}) {
  const entries = new Map();

  return {
    start(key, hash) {
      const now = clock();
      const current = entries.get(key);

      // 5. Võti tuleb kliendilt ja seob päringu selle sisuga.
      if (current && now >= current.expiresAt) {
        entries.delete(key);
      }

      const entry = entries.get(key);

      if (!entry) {
        entries.set(key, {
          hash,
          state: 'running',
          response: null,
          expiresAt: now + ttl,
        });

        return { kind: 'next' };
      }

      // 3. Sama võti erineva sisuga tähendab konflikti.
      if (entry.hash !== hash) {
        return { kind: 'conflict' };
      }

      // 1. Sama võti ja pooleliolev töö.
      if (entry.state === 'running') {
        return { kind: 'running' };
      }

      // 2. Valmis töö kordamisel tagastatakse salvestatud vastus.
      return {
        kind: 'repeat',
        response: entry.response,
      };
    },

    finish(key, response) {
      const entry = entries.get(key);

      if (entry) {
        entry.state = 'done';
        entry.response = response;
        entry.expiresAt = clock() + ttl;
      }
    },

    // 4. Ebaõnnestunud töö korral vabastatakse võti korduskatseks.
    abort(key) {
      const entry = entries.get(key);

      if (entry?.state === 'running') {
        entries.delete(key);
      }
    },
  };
}

// 6. Tööde järjekord korduskatsete ja surnukirjade nimekirjaga.
export function createQueue({ maxAttempts = 3, clock = Date.now } = {}) {
  const jobs = [];
  const idempotencyKeys = new Set();
  let nextId = 1;

  return {
    add(kind, data, { idempotencyKey } = {}) {
      // Sama korduvusvõtmega tööd lisatakse ainult üks kord.
      if (idempotencyKey && idempotencyKeys.has(idempotencyKey)) {
        return null;
      }

      if (idempotencyKey) {
        idempotencyKeys.add(idempotencyKey);
      }

      const job = {
        id: nextId++,
        kind,
        data,
        status: 'pending',
        attempts: 0,
        createdAt: clock(),
        err: null,
      };

      jobs.push(job);
      return job;
    },

    // Töötleb järjekorras olevad tööd ükshaaval.
    async process(handlers) {
      let result;
      let ok = false;
      let retried = false;

      const pendingJobs = jobs.filter((job) => job.status === 'pending');

      for (const job of pendingJobs) {
        job.status = 'running';
        job.attempts += 1;

        try {
          const handler = handlers[job.kind];

          if (typeof handler !== 'function') {
            throw new Error(`Handler puudub: ${job.kind}`);
          }

          const value = await handler(job.data);

          job.status = 'done';
          job.result = value;
          job.err = null;

          if (!ok) {
            result = value;
          }

          ok = true;
        } catch (error) {
          job.err = error.message || String(error);

          if (job.attempts < maxAttempts) {
            // Ebaõnnestunud töö jääb järgmise katse jaoks järjekorda.
            job.status = 'pending';
            retried = true;
          } else {
            // 6. Kolmanda ebaõnnestumise järel liigub töö surnukirjadesse.
            job.status = 'dead';
          }
        }
      }

      return { ok, result, retried };
    },

    pending() {
      return jobs.filter((job) => job.status === 'pending').length;
    },

    done() {
      return jobs.filter((job) => job.status === 'done').length;
    },

    // 6. Surnukirjade nimekiri sisaldab ebaõnnestunud töid ja nende vigu.
    dead() {
      return jobs
        .filter((job) => job.status === 'dead')
        .map((job) => ({ ...job }));
    },
  };
}

// 7. E-kiri lisatakse järjekorda ostuga seotud korduvusvõtmega.
export function mailJob(order, event) {
  return {
    kind: 'email',
    data: {
      target: order.email,
      topic: `Ost sündmusele ${event.name}`,
      idempotencyKey: `email:order:${order.id}`,
    },
  };
}

// 8. Sama ajaakna sees genereeritakse alati sama võti.
export function windowKey(name, timestamp, windowMs) {
  const window = Math.floor(timestamp / windowMs);
  return `${name}:${window}`;
}

// 9. Aegunud vabade hoidude vabastamine kontrollib ka hoidude seisu.
export function releaseExpiredHolds(holds, now) {
  const released = [];

  for (const hold of holds) {
    if (hold.state === 'pending' && hold.expiresAt <= now) {
      hold.state = 'expired';
      released.push(hold.id);
    }
  }

  return released;
}
