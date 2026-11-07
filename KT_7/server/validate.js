
import { z } from 'zod';
import { SORTABLE, FILTERABLE } from './query.js';
import { PAGE_DEFAULT, PAGE_MAX } from './read-page.js';
import { ServiceError } from './layers.js';
import { zodFields } from './zod-fields.js';
import { validate } from './validate-middleware.js';

// 1. Схема заказа: строгая проверка всех полей.
export const OrderSchema = z.object({
  event: z.number().int().positive(),
  qty: z.number().int().min(1).max(10),
  buyer: z.string().trim().min(2),
  email: z.string().trim().email(),
}).strict();

// 4. Схема изменения события: хотя бы одно поле.
export const EventChange = z.object({
  name: z.string().trim().min(1).optional(),
  venue: z.string().trim().min(1).optional(),
  start: z.string().trim().min(1).optional(),
  seats: z.number().int().positive().optional(),
  sold: z.number().int().min(0).optional(),
  price: z.number().min(0).optional(),
}).strict().refine(
  (value) => Object.keys(value).length > 0,
);

// 3. Преобразование параметров пагинации по правилам Ex3.
function pageValue(value, fallback, maximum = Infinity) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number) || number < 1) return fallback;
  return Math.min(number, maximum);
}

// 3. Схема параметров списка: coerce для чисел, strip для лишних полей.
export const ListQuery = z.object({
  search: z.string().trim().optional(),

  sort: z.string().refine((value) => {
    const field = value.startsWith('-') ? value.slice(1) : value;
    return SORTABLE.includes(field);
  }).optional(),

  venue: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === ''
      ? undefined
      : value,
    z.string().trim().optional(),
  ),

  min_price: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.coerce.number().finite().min(0).optional(),
  ),

  max_price: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.coerce.number().finite().min(0).optional(),
  ),

  free_at_least: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.coerce.number().finite().min(0).optional(),
  ),

  page: z.preprocess(
    (value) => pageValue(value, 1),
    z.number().int().min(1),
  ),

  per: z.preprocess(
    (value) => pageValue(value, PAGE_DEFAULT, PAGE_MAX),
    z.number().int().min(1).max(PAGE_MAX),
  ),
}).strip();

// 6. Ühtne veakuju: inimesele err, masinale code, vormile fields.
export function errorShape(code, err, options = {}) {
  return {
    err,
    code,
    ...(options.fields && Object.keys(options.fields).length
      ? { fields: options.fields }
      : {}),
    ...(options.detail !== undefined
      ? { detail: options.detail }
      : {}),
  };
}

// 6. Veakoodide ja HTTP-staatuste vastavus.
export const ERROR_CODES = {
  INVALID_INPUT: 422,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
};

// 7. Teenuse vead teisendatakse ühtseks HTTP-vorminguks.
export function serviceErrorHandler() {
  const kindToCode = {
    not_found: 'NOT_FOUND',
    conflict: 'CONFLICT',
    invalid: 'INVALID_INPUT',
    unauthenticated: 'UNAUTHENTICATED',
    forbidden: 'FORBIDDEN',
  };

  return (err, req, res, next) => {
    if (!(err instanceof ServiceError)) return next(err);

    const code = kindToCode[err.kind] ?? 'INTERNAL_SERVER_ERROR';
    const status = ERROR_CODES[code] ?? 500;

    return res.status(status).json(errorShape(
      code,
      err.message,
      err.detail ? { detail: err.detail } : {},
    ));
  };
}

// 9. Eemaldatakse juhtmärgid, kuid säilitatakse < ja reavahetused.
export function cleanText(value) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
    .trim();
}

// 6. ja 8. Etteantud funktsioonide eksport.
export { zodFields, validate };
