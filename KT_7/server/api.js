import { baseUrl } from './connection.js';

const API_BASE_URL = baseUrl();

export const API = {
  events: `${API_BASE_URL}/events`,
  seatmap: (id) => `${API_BASE_URL}/events/${encodeURIComponent(id)}/seatmap`,
};
