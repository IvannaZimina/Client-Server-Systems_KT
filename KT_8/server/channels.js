// 1. Kanalid ja ruumid
export function createHub() {
  const channels = new Map();
  const connectionChannels = new Map();

  function join(connection, channel) {
    if (!channels.has(channel)) {
      channels.set(channel, new Set());
    }

    channels.get(channel).add(connection);

    if (!connectionChannels.has(connection)) {
      connectionChannels.set(connection, new Set());
    }

    connectionChannels.get(connection).add(channel);
  }

  function leave(connection, channel) {
    const members = channels.get(channel);
    if (!members) return;

    members.delete(connection);

    if (members.size === 0) {
      channels.delete(channel);
    }

    const joined = connectionChannels.get(connection);
    if (joined) {
      joined.delete(channel);

      if (joined.size === 0) {
        connectionChannels.delete(connection);
      }
    }
  }

  function leaveAll(connection) {
    const joined = connectionChannels.get(connection);
    if (!joined) return;

    for (const channel of [...joined]) {
      leave(connection, channel);
    }
  }

  function send(channel, data) {
    const members = channels.get(channel);
    if (!members) return 0;

    const message = JSON.stringify(data);
    let sent = 0;

    for (const connection of members) {
      if (connection.open) {
        connection.send(message);
        sent += 1;
      }
    }

    return sent;
  }

  return {
    join,
    leave,
    leaveAll,
    send,
    members: (channel) => channels.get(channel)?.size ?? 0,
    channelCount: () => channels.size,
    channelsOf: (connection) => [
      ...(connectionChannels.get(connection) ?? []),
    ],
  };
}

// 2. Ühenduse autentimine
export function authConnection(credentials, verify) {
  if (credentials.cookie) {
    const user = verify(credentials.cookie);

    if (user) {
      return { ok: true, user, via: 'cookie' };
    }

    return { ok: false, code: CLOSE_CODES.unauthenticated };
  }

  const message = credentials.firstMessage;

  if (message?.kind === 'auth' && message.token) {
    const user = verify(message.token);

    if (user) {
      return { ok: true, user, via: 'message' };
    }
  }

  return { ok: false, code: CLOSE_CODES.unauthenticated };
}

// 3. Sulgemiskoodid ja taasühendamise otsus
export const CLOSE_CODES = {
  healthy: 1000,
  abnormal: 1006,
  unauthenticated: 4401,
  forbidden: 4403,
  overload: 4429,
  shuttingDown: 4503,
};

export function shouldReconnect(code) {
  const noReconnect = [
    CLOSE_CODES.healthy,
    CLOSE_CODES.unauthenticated,
    CLOSE_CODES.forbidden,
  ];

  return !noReconnect.includes(code);
}

// 4. Kasvava ooteajaga taasühendamine
export function createReconnector({
  base = 500,
  factor = 2,
  cap = 30000,
  jitter = 0.3,
} = {}) {
  let count = 0;

  return {
    nextDelay() {
      const delay = Math.min(base * factor ** count, cap);
      count += 1;

      const variation = 1 + (Math.random() * 2 - 1) * jitter;
      return Math.round(delay * variation);
    },

    succeeded() {
      count = 0;
    },

    attempts() {
      return count;
    },
  };
}

// 5. Ühenduse elusoleku kontroll ping-pong abil
export function createHeartbeat() {
  const connections = new Map();

  function add(connection) {
    connections.set(connection, true);
  }

  function pong(connection) {
    if (connections.has(connection)) {
      connections.set(connection, true);
    }
  }

  function round() {
    const dead = [];

    for (const [connection, alive] of connections) {
      if (!alive) {
        connection.close(4000);
        connections.delete(connection);
        dead.push(connection);
      } else {
        connections.set(connection, false);
        connection.ping();
      }
    }

    return dead;
  }

  return { add, pong, round };
}