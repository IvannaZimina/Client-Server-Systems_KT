
// 1. Neli tagasisurve strateegiat.
export const STRATEGIES = {
  buffer: {
    loses: 'mitte midagi',
    fits: 'mitte kunagi tootmises, sest mälu kasvab piiramatult',
  },
  drop_new: {
    loses: 'uued teated',
    fits: 'kui vanemad teated on tähtsamad',
  },
  drop_old: {
    loses: 'vanad teated',
    fits: 'kui kõige uuem seis on tähtsam',
  },
  last_only: {
    loses: 'vahepealsed seisud',
    fits: 'kui oluline on ainult viimane seis',
  },
};

// 2. Valitud strateegia järgi hallatakse aeglase kliendi järjekorda.
export function createStream({ strategy = 'buffer', cap = 3, send = () => {} } = {}) {
  const queue = [];
  let lostCount = 0;

  return {
    add(value) {
      if (strategy === 'last_only') {
        if (queue.length > 0) {
          lostCount += queue.length;
          queue.length = 0;
        }
        queue.push(value);
        return;
      }

      if (strategy === 'drop_new') {
        if (queue.length >= cap) {
          lostCount += 1;
          return;
        }
        queue.push(value);
        return;
      }

      if (strategy === 'drop_old') {
        if (queue.length >= cap) {
          queue.shift();
          lostCount += 1;
        }
        queue.push(value);
        return;
      }

      // Buffer säilitab kõik teated, kuid järjekord võib kasvada.
      queue.push(value);
    },

    // Saadab järjekorrast kuni limit teadet.
    clear(limit = Infinity) {
      let sent = 0;

      while (queue.length > 0 && sent < limit) {
        send(queue.shift());
        sent += 1;
      }

      return sent;
    },

    pending() {
      return queue.length;
    },

    lost() {
      return lostCount;
    },
  };
}

// 3. Piletikassa jaoks sobib last_only, sest oluline on ainult viimane vabade kohtade arv.
 
// 4. Sulge aeglane klient suure väljaminevate andmete puhvri korral.
export function shouldClose(bufferedAmount) {
  return bufferedAmount > 1_000_000;
}

// 6–8. Jagatud serveri vahemälu TTL-i, LRU ja siltidega.
export function createCache({ ttl = 300000, cap = 100, clock = Date.now } = {}) {
  const entries = new Map();
  let hits = 0;
  let misses = 0;

  function removeExpired(key) {
    const entry = entries.get(key);

    if (entry && clock() >= entry.expiresAt) {
      entries.delete(key);
      return true;
    }

    return false;
  }

  return {
    read(key) {
      removeExpired(key);

      const entry = entries.get(key);

      if (!entry) {
        misses += 1;
        return undefined;
      }

      // Loetud kirje liigub LRU järjekorra lõppu.
      entries.delete(key);
      entries.set(key, entry);
      hits += 1;

      return entry.value;
    },

    write(key, value, tags = []) {
      if (entries.has(key)) {
        entries.delete(key);
      } else if (entries.size >= cap) {
        // Kõige kauem kasutamata kirje eemaldatakse esimesena.
        const oldestKey = entries.keys().next().value;
        entries.delete(oldestKey);
      }

      entries.set(key, {
        value,
        tags: new Set(tags),
        expiresAt: clock() + ttl,
      });
    },

    // 8. Eemaldab kõik kirjed, mis on seotud antud sildiga.
    evictTag(tag) {
      let removed = 0;

      for (const [key, entry] of entries) {
        if (entry.tags.has(tag)) {
          entries.delete(key);
          removed += 1;
        }
      }

      return removed;
    },

    size() {
      for (const key of entries.keys()) {
        removeExpired(key);
      }

      return entries.size;
    },

    stats() {
      return { hits, misses };
    },
  };
}

// 9. Salajasi ja kasutajapõhiseid andmeid ei salvestata jagatud vahemällu.
export function mayCache({
  secret = false,
  perUser = false,
  changesOften = false,
} = {}) {
  if (secret) {
    return {
      allowed: false,
      reason: 'Jagatud vahemälus võivad eri kasutajate andmed seguneda.',
      ttl: 0,
    };
  }

  if (perUser) {
    return {
      allowed: false,
      reason: 'Jagatud vahemälus võivad eri kasutajate andmed seguneda.',
      ttl: 0,
    };
  }

  return {
    allowed: true,
    reason: 'Andmeid võib jagatud vahemällu salvestada.',
    ttl: changesOften ? 5000 : 300000,
  };
}
