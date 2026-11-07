// C07 Ex5 — ETTE ANTUD OpenAPI-laadne lihtsustatud leping. Seda faili sa EI
// kirjuta.
//
// Leping on ANDMED — ta kirjeldab, MIDA API lubab. Ex5 töö algab sealt,
// kus seda lubadust tuleb MASINAGA JÕUSTADA: lepingutest, mock ja
// murdvate muudatuste tuvastus.
//
// ★ See EI OLE kehtiv OpenAPI dokument, vaid tema lihtsustatud kuju: teed,
//   meetodid ja vastused on samas kohas, aga skeemid on `schemas` all
//   (OpenAPI-s `components.schemas`), viide on skeemi nimi (OpenAPI-s
//   `$ref`), väljad on nimi -> tüüp (OpenAPI-s `properties`) ja nõutud päised
//   on nimekiri. Kontrollija jääb nii lühikeseks; mõte on sama.
//
// ★ Loe ta läbi ENNE koodi kirjutamist. Just nii käib lepingupõhine
//   arendus: kirjeldus enne koodi, ja kliendi meeskond saab mock-serveri
//   vastu tööd alustada juba enne, kui server valmis on.

import { SCHEMAS } from './api-schemas.js';

export const CONTRACT = {
  info: { title: 'Piletikassa API', version: '1.0.0' },
  servers: [{ url: '/api/v1' }],
  paths: {
    '/events': {
      get: {
        summary: 'Sündmuste loend',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string', maxLength: 100 } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'per', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
        ],
        responses: {
          200: { description: 'Leheküljestatud loend', schema: 'List' },
        },
      },
    },
    '/events/{id}': {
      get: {
        summary: 'Üks sündmus',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Sündmus', schema: 'Event' },
          404: { description: 'Ei leitud', schema: 'Error' },
        },
      },
    },
    '/orders': {
      post: {
        summary: 'Loo ost',
        requestBody: { required: true, schema: 'NewOrder' },
        responses: {
          201: { description: 'Loodud', schema: 'Order', headers: ['Location'] },
          422: { description: 'Vigane sisend', schema: 'Error' },
          409: { description: 'Vabu kohti ei jätku', schema: 'Error' },
        },
      },
    },
  },
  schemas: SCHEMAS,
};
