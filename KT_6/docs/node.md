
# C06 — Ülesanne 1: Node ja brauser kõrvuti

### 1. Kirjuta envVars(), mis kontrollib globaale, mitte ei loetle peast.

Failis `server/env.js` loodi funktsioon `envVars()`, mis kontrollib globaalsete objektide olemasolu Node.js keskkonnas.
Kontrollimiseks kasutati `typeof` operaatorit ja `globalThis` objekti.
Tulemused:

| Omadus       | Brauseris | Node-is       |
| ------------ | --------- | ------------- |
| document     | on        | ei ole        |
| window       | on        | ei ole        |
| localStorage | on        | ei ole        |
| process      | ei ole    | on            |
| Buffer       | ei ole    | on            |
| fetch        | on        | on            |
| URL          | on        | on            |
| JSON         | on        | on            |
| __dirname    | ei ole    | ei ole ESM-is |

`document`, `window` ja `localStorage` kuuluvad brauseri keskkonda.
`process` ja `Buffer` on Node.js keskkonna globaalsed objektid.
`fetch`, `URL` ja `JSON` on olemas mõlemas keskkonnas.

---

### 2. Jooksuta ta ja pane tulemus tabelisse: brauseriomad, nodeomad, mõlemas.

Funktsiooni `envVars()` käivitamisel kontrolliti globaalide olemasolu Node.js keskkonnas.
Tulemused jagunevad kolme rühma:

| Brauseriomad | Node omad | Mõlemas |
| ------------ | --------- | ------- |
| document     | process   | fetch   |
| window       | Buffer    | URL     |
| localStorage |           | JSON    |

Node.js-is puuduvad brauseri objektid `document`, `window` ja `localStorage`.
Node.js-is on olemas `process` ja `Buffer`, mida kasutatakse serveripoolses JavaScriptis.
`fetch`, `URL` ja `JSON` on kasutatavad mõlemas keskkonnas. `fetch` on Node.js-is sisseehitatud alates versioonist 18, seega eraldi paketti pole vaja.

---

### 3. Leia ES-moodulis __dirname asendus ja kirjuta ta ühele reale.

ES-moodulis puudub muutuja `__dirname`.
Selle asendamiseks kasutati järgmist koodirida:
`const HERE = path.dirname(fileURLToPath(import.meta.url));`
`import.meta.url` annab praeguse moodulifaili URL-i.
`fileURLToPath()` teisendab URL-i tavaliseks failiteeks ja `path.dirname()` tagastab kataloogi asukoha.
Node.js 20.11 ja uuemates versioonides saab kasutada ka `import.meta.dirname`.

---

### 4. Proovi ka new URL(...).pathname ja vaata, mis tühikutega teel juhtub.

Prooviti failitee leidmiseks kasutada järgmist lahendust:
`new URL('./events.json', import.meta.url).pathname`
Tühikuid sisaldava failitee korral teisendatakse tühikud kujule `%20`.
Näiteks võib OneDrive'i kausta nimi sisaldada tühikuid. Sellisel juhul ei anna `.pathname` alati Node.js-i failisüsteemi jaoks sobivat failiteed.
Seetõttu kasutati lahendust:
`fileURLToPath(new URL('./events.json', import.meta.url))`
See teisendab URL-i korrektseks failiteeks ja säilitab tühikud õigel kujul.

---

### 5. Kirjuta tabel: mida ^, ~ ja täpne versioon lubavad, kolme näitega.

Semver määrab, milliseid teegi versioone võib projekti paigaldada.

| Märgis         | Tähendus                                                                    |
| -------------- | --------------------------------------------------------------------------- |
| `^`            | Lubab uuemaid versioone, mis ei muuda esimest nullist erinevat versiooniosa |
| `~`            | Lubab uuemaid patch-versioone samas minoorversioonis                        |
| Täpne versioon | Lubab ainult määratud versiooni                                             |

**Näide 1: `^5.1.0`**
- Lubab `5.2.0`.
- Lubab `5.1.9`.
- Ei luba `6.0.0`.

**Näide 2: `~5.1.0`**
- Lubab `5.1.9`.
- Lubab `5.1.1`.
- Ei luba `5.2.0`.

**Näide 3: `5.1.0`**
- Lubab ainult `5.1.0`.
- Ei luba `5.1.1`.
- Ei luba `5.2.0`.

Nulliga algavate versioonide puhul on reeglid rangemad. Näiteks `^0.3.1` lubab ainult `0.3.x` versioone alates `0.3.1`, aga ei luba `0.4.0`.
Versioonide kontrollimiseks kasutati etteantud faili `materials/npm-semver.js` funktsiooni `versionRange()`.

---

## 6. Seleta ühe lausega, miks npm install konveieris teeb ehituse korratamatuks.

`npm install` võib sõltuvuste versioone uuendada vastavalt `package.json` failis määratud versioonivahemikele ja muuta `package-lock.json` faili, mistõttu ei pruugi igal ehitamisel paigaldatud sõltuvused olla samad.
Konveieris kasutatakse `npm ci`, sest see paigaldab sõltuvused olemasoleva `package-lock.json` faili järgi ega muuda seda.

---

### 7. Kirjuta readEvents ja writeReport node:fs/promises abil.

Failis `server/env.js` loodi kaks asünkroonset funktsiooni.
Funktsioon `readEvents(file)` loeb JSON-faili UTF-8 kodeeringus ja teisendab selle JavaScripti objektiks funktsiooniga `JSON.parse()`.
Funktsioon `writeReport(target, rows)` koostab sündmuste andmetest CSV-raporti.
Raportis kasutatakse nelja veergu:

- `id`
- `name`
- `sold`
- `seats`

Failide lugemiseks ja kirjutamiseks kasutatakse `node:fs/promises` mooduli funktsioone `readFile()` ja `writeFile()`.
CSV-väljade töötlemiseks kasutatakse abifunktsiooni `csvCell()`, mis arvestab komade, jutumärkide ja reavahetustega.

---

### 8. Kirjuta ATOMAARSELT: ajutisse faili ja siis rename — põhjenda dokumendis.

Raporti kirjutamisel kasutatakse ajutist faili laiendiga `.tmp`.
Kõigepealt kirjutatakse kogu raport ajutisse faili funktsiooniga `writeFile()`. Pärast edukat kirjutamist nimetatakse ajutine fail ümber lõplikuks failiks funktsiooniga `rename()`.
Selline lahendus aitab vältida olukorda, kus programmi katkemisel jääb lõplik raport poolikuks.
Ajutine fail asub lõpliku failiga samas kataloogis, et ümbernimetamine toimuks sama failisüsteemi piires.
Kui kirjutamine või ümbernimetamine ebaõnnestub, eemaldatakse ajutine fail funktsiooniga `unlink()`.

---

### Kontrolli töö tulemust.

Töö kontrollimiseks kasutati etteantud faili `materials/check-env.js`.
Kontrollimiseks käivitati projekti juurkataloogis käsk:
```bash
node materials/check-env.js
```
Kontrolliti järgmisi osi:
- Node.js ja brauseri globaalsete objektide olemasolu.
- ES-mooduli failitee leidmine.
- Semver-versioonivahemike kontroll.
- Sündmuste lugemine JSON-failist.
- CSV-raporti kirjutamine.
- Ajutise faili eemaldamine.
- Node.js protsessi informatsioon.

Oodatav tulemus: `29 kontrolli OK`
Kõik kontrollid peavad läbima ilma vigadeta.
