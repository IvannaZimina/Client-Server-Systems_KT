// 1. REST-aadressid: mitmuse nimisõnad ja pesastatud ressursid
export const ROUTES = {
  events: '/api/events',
  event: (id) => `/api/events/${id}`,
  seatmap: (id) => `/api/events/${id}/seatmap`,
  orders: '/api/orders',
  order: (id) => `/api/orders/${id}`,
  cancellation: (id) => `/api/orders/${id}/cancellation`,
};


// 2. Lubatud HTTP-meetodid kõigil kuuel aadressil
export const ALLOWED = {
  events: ['GET', 'HEAD', 'OPTIONS', 'POST'],
  event: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'PUT'],
  seatmap: ['GET', 'HEAD', 'OPTIONS'],
  orders: ['GET', 'HEAD', 'OPTIONS', 'POST'],
  order: ['GET', 'HEAD', 'OPTIONS', 'PUT'],
  cancellation: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST'],
};


// 3. PUT ja PATCH ning päringu sisendi kontroll
export {
  applyPut,
  applyPatch,
  inputCode,
  wrongMethod,
} from './rest-mechanics.js';


// 4. PUT idempotentsus: sama päringu kordamine annab sama lõppseisu
// Rakendamine toimub antud applyPut() funktsioonis.


// 5. Tühistamine on eraldi nimisõnaline ressurss:
// /api/orders/:id/cancellation


// 6. Piletikassa olukordade HTTP-staatuse koodid
export const STATUS = {
  brokenJson: 400,
  negativeCount: 422,
  unknownEventInOrder: 422,
  eventGone: 404,
  seatTaken: 409,
  tooManyTickets: 409,
  cancelledTwice: 409,
  noLogin: 401,
  notOrganizer: 403,
};


// 7. Vale HTTP-meetodi korral kasutatakse vastava ressursi ALLOWED-tabelit.
// wrongMethod() tagastab 405 koos Allow-päisega.


// 8. API versioon lisatakse /api ja ressursi vahele
export function versioned(path) {
  return path.replace(/^\/api(?=\/|$)/, '/api/v1');
}