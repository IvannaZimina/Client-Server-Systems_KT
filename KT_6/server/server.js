
// C06 Ex4 — Server startup

import fs from 'node:fs';

import { readConfig } from './plain.js';
import { createStore } from '../materials/store.js';
import { createApp } from './app.js';
import { installProcessGuards } from '../materials/process-guards.js';

// Protsessi taseme veakaitsed
installProcessGuards();

// Konfiguratsiooni kontroll enne serveri käivitamist
const config = readConfig();

// Sündmuste andmete laadimine
const events = JSON.parse(
  fs.readFileSync(
    new URL('../materials/events.json', import.meta.url),
    'utf8'
  )
);

// Andmehoidla ja rakenduse loomine
const store = createStore(events);
const app = createApp(store);

// Serveri käivitamine
app.listen(config.port, () => {
  console.log(`Server töötab aadressil http://localhost:${config.port}`);
});
