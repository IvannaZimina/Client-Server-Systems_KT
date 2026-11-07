// server/errors.js
// C06 Ex4 — Veaklassid ja veavastuse koostamine

import {
  RuntimeError,
  isRuntimeError
} from '../materials/runtime-error.js';

// 404 — küsitud kirjet ei ole
export class NotFound extends RuntimeError {
  constructor(message = 'Kirjet ei leitud', detail = null) {
    super(message, 404, detail);
    this.name = 'NotFound';
  }
}

// 422 — sisendandmed on vigased
export class InvalidInput extends RuntimeError {
  constructor(message = 'Vigased sisendandmed', detail = null) {
    super(message, 422, detail);
    this.name = 'InvalidInput';
  }
}

// 409 — olemasolev seisund ei võimalda toimingut
export class Conflict extends RuntimeError {
  constructor(message = 'Andmete konflikt', detail = null) {
    super(message, 409, detail);
    this.name = 'Conflict';
  }
}

// Käitusviga vastab oma sildi järgi.
// Kõik muud vead käsitletakse programmivigadena.
export function makeErrorResponse({ isDev = false } = {}) {
  return (err, conditions) => {
    const runtimeError = isRuntimeError(err);
    const code = runtimeError ? err.status : 500;

    const message = runtimeError
      ? err.message
      : 'Serveri sisemine viga';

    const body = {
      err: message,
      request: conditions.requestId
    };

    const logEntry = {
      kind: runtimeError ? 'runtimeError' : 'programmingError',
      requestId: conditions.requestId,
      route: conditions.route,
      code,
      message: err?.message ?? String(err)
    };

    if (runtimeError && err.detail !== null) {
      body.detail = err.detail;
      logEntry.detail = err.detail;
    }

    // Stack trace on nähtav ainult arenduskeskkonnas.
    if (isDev && err?.stack) {
      body.stack = err.stack;
      logEntry.stack = err.stack;
    }

    return {
      code,
      body,
      logEntry
    };
  };
}