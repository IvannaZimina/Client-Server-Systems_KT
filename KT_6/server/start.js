// C06 Ex3 — Start local server

import fs from 'node:fs';
import { createStore } from '../materials/store.js';
import { createApp } from './app.js';

const DATA = JSON.parse(
  fs.readFileSync(
    new URL('../materials/events.json', import.meta.url),
    'utf8'
  )
);

const store = createStore(DATA);
const app = createApp(store);

app.listen(3006, () => {
  console.log('Server töötab aadressil http://localhost:3006');
});