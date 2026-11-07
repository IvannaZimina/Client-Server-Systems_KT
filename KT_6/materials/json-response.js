// C06 Ex2 — ETTE ANTUD JSON-vastus. Seda faili sa EI kirjuta.
//
// ★ VAATA TA LÄBI. `res.json(...)` teeb Expressis täpselt selle. Kaks asja,
//   mille unustamine on omaette veaklass:
//     charset=utf-8      ilma temata arvab klient ise, ja „Sügis“ läheb katki
//     Content-Length     ilma temata ei tea klient, millal vastus lõppes

export function json(res, code, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...headers,
  });
  res.end(body);
}
