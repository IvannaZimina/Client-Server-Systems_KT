
 // 1. Baas-URL keskkonnamuutujate põhjal.
export function baseUrl(env = process.env) {
  const apiUrl = env.API_URL?.trim();

  if (apiUrl) {
    return apiUrl.replace(/\/+$/, '');
  }

  const port = env.PORT || '3000';
  return `http://localhost:${port}/api/v1`;
}

// 2–3. CORS-i vaikeseis on keelatud; credentials lubatakse ainult konkreetsete päritoludega.
export function corsOptions(env = process.env) {
  const origins = (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin !== '' && origin !== '*');

  const options = {
    origins,
    credentials: origins.length > 0,
    exposedHeaders: ['Location'],
    maxAge: 600,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  };

  // 4. Päritolu kontrollitakse enne CORS-päise lubamist.
  options.origin = (origin, callback) => {
    callback(null, isAllowed(options, origin));
  };

  return options;
}

// 4–5. Päritoluta päringud läbivad kontrolli; tundmatud päritolud lükatakse tagasi.
export function isAllowed(options, origin) {
  if (origin === undefined) {
    return true;
  }

  return options.origins.includes(origin);
}

// 6. REST, GraphQL ja gRPC päringute arv ning HTTP-vahemälu kasutamine.
export const STYLES = {
  REST: {
    events: {
      requests: 1,
      httpCache: true,
      why: 'GET päring võimaldab vahemälu.',
    },
    seatmap: {
      requests: 2,
      httpCache: true,
      why: 'Kaks GET päringut võimaldavad vahemälu.',
    },
    buyTickets: {
      requests: 1,
      httpCache: false,
      why: 'POST muudab serveri andmeid.',
    },
  },
  GraphQL: {
    events: {
      requests: 1,
      httpCache: false,
      why: 'POST päring ei kasuta tavalist HTTP-vahemälu.',
    },
    seatmap: {
      requests: 1,
      httpCache: false,
      why: 'Üks päring tagastab vajalikud andmed.',
    },
    buyTickets: {
      requests: 1,
      httpCache: false,
      why: 'Mutatsioon muudab serveri andmeid.',
    },
  },
  gRPC: {
    events: {
      requests: 1,
      httpCache: false,
      why: 'HTTP/2 POST ei kasuta tavalist HTTP-vahemälu.',
    },
    seatmap: {
      requests: 2,
      httpCache: false,
      why: 'Kaks eraldi RPC meetodit kasutavad POST päringuid.',
    },
    buyTickets: {
      requests: 1,
      httpCache: false,
      why: 'RPC meetod muudab serveri andmeid.',
    },
  },
};

// 7. API-stiili valik kliendi tüübi, latentsuse ja andmete sügavuse järgi.
export function suggestStyle({ client, latencySensitive = false, entityDepth = 1 } = {}) {
  if (client === 'browser') {
    return 'REST';
  }

  if (client === 'service' && latencySensitive) {
    return 'gRPC';
  }

  if (client === 'mobile' && entityDepth > 1) {
    return 'GraphQL';
  }

  if (client === 'mobile' && entityDepth <= 1) {
    return 'REST';
  }

  return 'REST';
}
