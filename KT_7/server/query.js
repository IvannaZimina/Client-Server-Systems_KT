import { readPage } from './read-page.js';
// 1. Lubatud sortimisväljad: free arvutatakse kohtade arvu põhjal.
export const SORTABLE = ['start', 'name', 'price', 'free'];

// 1. Lubatud filtrid piletikassa sündmuste jaoks.
export const FILTERABLE = ['venue', 'min_price', 'max_price', 'free_at_least'];

// 2. Vigase sisendi korral tagastatakse veaväljad.
function invalidInput(fields) {
  const error = new Error('Vigane päringu parameeter');
  error.fields = fields;
  throw error;
}

// 2. Miinusmärgiga määratakse kahanev sortimine.
export function readSort(sort) {
  if (sort === undefined || sort === '') {
    return { field: 'start', dir: 1 };
  }

  if (typeof sort !== 'string') {
    invalidInput({ sort: `lubatud: ${SORTABLE.join(', ')}` });
  }

  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;

  if (!SORTABLE.includes(field)) {
    invalidInput({ sort: `lubatud: ${SORTABLE.join(', ')}` });
  }

  return { field, dir: descending ? -1 : 1 };
}

// 4. Tühjad ja tundmatud filtrid jäetakse vahele.
// Vigane või negatiivne arv põhjustab vea.
export function readFilters(query = {}) {
  const filters = {};

  for (const key of FILTERABLE) {
    const value = query[key];

    if (value === undefined || value.trim() === '') {
      continue;
    }

    if (key === 'venue') {
      filters.venue = value.trim();
      continue;
    }

    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
      invalidInput({ [key]: 'peab olema mittenegatiivne arv' });
    }

    filters[key] = number;
  }

  return filters;
}

// 6. Lehekülgede lugemine on eraldi failis.
export {
  readPage,
  PAGE_DEFAULT,
  PAGE_MAX,
} from './read-page.js';

// 6. Plaani rakendamine on eraldi kihis.
export { apply } from '../materials/plan-apply.js';

// 6. Koostatakse päringu plaan ilma SQL-i või andmehoidlata.
export function createPlan(query = {}) {
  const search = typeof query.search === 'string'
    ? query.search.trim()
    : '';

  const sort = readSort(query.sort);
  const filters = readFilters(query);
  const { page, per, offset } = readPage(query);

  return {
    search,
    filters,
    sort,
    page,
    per,
    offset,
  };
}
