// C06 Ex3 — Request ID middleware

import { randomUUID } from 'node:crypto';

export function requestId() {
  return (req, res, next) => {
    const clientId = req.get('X-Request-Id');
    const id = clientId && clientId.trim()
      ? clientId.trim()
      : randomUUID();

    req.id = id;
    res.setHeader('X-Request-Id', id);

    next();
  };
}