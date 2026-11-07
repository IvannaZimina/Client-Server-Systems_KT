// C05 Exercise 2, points 2-10: promise chains, async/await and combinators.
import { wait, delayedValue, delayedError } from '../materials/async-helpers.js';
// 2.1.
import { chain } from '../materials/chain-example.js';
// 2.6.
import { sequential, parallel, settleAll, withTimeout } from '../materials/combinators.js';

// 2.2.
export async function chainWithAwait(id) {
  const trace = [];
  let result;
  try {
    // 2.3.
    result = await delayedValue({ id, name: 'Sügiskontsert' }, 5);
    trace.push('sain sündmuse');
    result = { ...result, price: 24 };
    trace.push('lisasin hinna');
  } catch (error) {
    // 2.5.
    trace.push(`err: ${error.message}`);
    result = null;
  } finally {
    trace.push('finally');
  }
  return { result, trace };
}

// 2.1.
export { wait, delayedValue, delayedError };
// 2.4.
export { chain };
// 2.6.
export { sequential, parallel };
// 2.8.
export { settleAll };
// 2.9.
export { withTimeout };
