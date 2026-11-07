# Ülesanne 6 — veebikomponent ja moodulid

## 1. Kirjuta `HTMLElement`-i laiendav klass, registreeri `define`-iga, haagi varjus-DOM ja klooni sinna mall.

Kohandatud element on klass, sest brauser loob selle ise. Klass `TicketCard extends HTMLElement` asub failis `public/ticket-card.js`.

Konstruktoris luuakse varjus-DOM (`attachShadow`) ja kloonitakse sinna etteantud `TEMPLATE` (`cloneNode(true)`).

DOM-i lugemine ja sündmuste kuulajate lisamine toimuvad `connectedCallback`-is. Element registreeritakse nimega `ticket-card` käsuga `customElements.define`.

## 2. Kirjuta ise skriptisildid ja mõõda, mis järjekorras `defer`, `async` ja `module` käivituvad.

Atribuudid `defer` ja `async` toimivad väliste skriptidega, millel on `src`. Mõõtmiseks kasutatakse eraldi faile `public/defer.js` ja `public/async.js`. Moodul laaditakse sildiga:

`<script type="module" src="./main.js"></script>`

- `defer` laaditakse paralleelselt HTML-i parsimisega, kuid käivitatakse pärast parsimist.
- `async` laaditakse paralleelselt ja käivitatakse kohe, kui fail on valmis. Käivitamise järjekord ei ole tagatud.
- `module` käitub vaikimisi sarnaselt `defer`-iga.

Mõõdetud järjekord konsoolis:

```text
1. defer script loaded
2. async script loaded
3. ticket-card module loaded
```

`async`-skripti asukoht võib sõltuvalt laadimise kiirusest muutuda. See tulemus näitab konkreetse mõõtmise järjekorda.

## 3. Pane kuulaja `connectedCallback`-is ja võta ta maha `disconnectedCallback`-is.

`connectedCallback` leiab varjus oleva nupu ja lisab sellele sündmuse kuulaja.

Kuulaja funktsioon salvestatakse privaatsesse välja `#onClick`.

`disconnectedCallback` eemaldab sama funktsiooni käsuga `removeEventListener` ja nullib väljad.

Sama funktsiooni viide on vajalik, sest kuulaja eemaldamiseks peab kasutama sama funktsiooniobjekti, mis lisati.

## 4. Loetle `observedAttributes` ja uuenda nuppu `attributeChangedCallback`-is.

Jälgitav atribuut on `sold-out`:

`static observedAttributes = ["sold-out"];`

Atribuudi muutumisel kutsub `attributeChangedCallback` välja meetodi `updateButton()`.

| Atribuut          | Nupu tekst   | Nupu olek |
| ----------------- | ------------ | --------- |
| `sold-out` olemas | Välja müüdud | Keelatud  |
| `sold-out` puudub | Vali kohad   | Lubatud   |

## 5. Tee väljad `#`-iga päriselt privaatseks.

Komponendis kasutatakse kahte privaatset välja:

- `#button` — nupu viide.
- `#onClick` — sündmuse kuulaja funktsioon.

`#` muudab välja JavaScripti tasemel privaatseks. Väljastpoolt klassi ei saa sellele otse juurde pääseda.

Võrdlus:

| Viis      | Väljastpoolt ligipääs      |
| --------- | -------------------------- |
| `#button` | Ei, keelatud               |
| `_button` | Jah, ainult kokkuleppeline |

## 6. Kontrolli CSS-i isoleeritust `getComputedStyle` abil.

Lehe CSS-failis on globaalne reegel:

```css
h3 {
    color: red;
}
```

Varjus-DOM-i mallis on samuti `h3` element.

Mõlema elemendi värv mõõdetakse funktsiooniga `getComputedStyle(...).color`.

Mõõdetud tulemused:

| Kus           | Arvutatud värv   |
| ------------- | ---------------- |
| Lehel         | `rgb(255, 0, 0)` |
| Varjus-DOM-is | `rgb(0, 0, 0)`   |

Lehe globaalne CSS-reegel ei rakendu varjus-DOM-i sees olevale `h3` elemendile.

### Varjus-DOM-i kolm teadlikku stiilimise võimalust

| Võimalus       | Mida see lubab                                                       |
| -------------- | -------------------------------------------------------------------- |
| `:host`        | Stiilida kohandatud elementi ennast                                  |
| CSS-i pärimine | `color`, `font` ja CSS-muutuja `--line` võivad tulla host-elemendilt |
| `::part()`     | Leht saab stiilida elementi, millel on `part="button"`               |

Need võimalused annavad komponendile piiratud ja teadliku võimaluse kasutada lehe stiile.

## 7. Lisa import map ja lae moodul palja nimega.

`index.html` sisaldab import map'i:

```json
{
    "imports": {
        "seatmap": "../materials/seatmap.js"
    }
}
```

Moodul laaditakse palja nimega:

```javascript
import("seatmap");
```

ES-moodulid töötavad alati range režiimis (strict mode).

Määramata muutujale omistamine ei loo globaalset muutujat, vaid põhjustab vea.

Mõõdetud tulemus:

```text
Undefined module assignment: ReferenceError
```

## 8. Saada varjus-DOM-i seest `CustomEvent` lippudega `bubbles` ja `composed`.

Nupuvajutusel saadab komponent sündmuse `ticket-seatmap-request`.

Sündmuse `detail` sisaldab sündmuse ID-d (`eventId`). Lehe `document`-kuulaja püüab sündmuse kinni ja alustab saaliplaani laadimist.

Positiivse juhtumi korral kasutatakse:

```javascript
{
    bubbles: true,
    composed: true
}
```

Kontrolliti ka olukorda, kus `composed` on `false`.

Mõõdetud tulemus:

```text
Shadow DOM: true; Page: false
```

Võrdlus:

| Sündmuse lipud                     | Tulemus                                              |
| ---------------------------------- | ---------------------------------------------------- |
| `bubbles: true`, `composed: true`  | Sündmus jõuab `document`-ini                         |
| `bubbles: true`, `composed: false` | Sündmus levib varjus-DOM-i sees, kuid ei jõua lehele |

Seega `bubbles` üksi ei piisa. Varjus-DOM-i piirist väljumiseks on vaja ka `composed: true`.

## 9. Lae saaliplaan `await import(...)` abil ja kontrolli Network-paanilt laadimise aega.

Saaliplaani moodul laaditakse dünaamiliselt pärast nupuvajutust:

```javascript
const { drawSeatmap } = await import("seatmap");
```

Moodul ei lae lehe avamisel, vaid alles siis, kui kasutaja vajutab nuppu `Vali kohad`.

Network-paanil kontrollitud tulemus:

| Hetk                | `seatmap.js`    |
| ------------------- | --------------- |
| Lehe avamisel       | Ei ole laaditud |
| Pärast nupuvajutust | Laaditud        |

Konsoolis kuvatakse mooduli laadimise teade:

```text
seatmap.js laetud
```

Lehel kuvatakse tulemus:

```text
216 seats loaded for event 1
```

Saaliplaan sisaldab 12 rida ja 18 kohta reas ehk kokku 216 kohta.

Dünaamiline import võimaldab laadida mooduli alles siis, kui seda tegelikult vaja on.

---

## Mõõdetud tulemuste kokkuvõte

| Kontroll                        | Tulemus                         |
| ------------------------------- | ------------------------------- |
| Veebikomponendi registreerimine | `ticket-card`                   |
| Shadow DOM-i CSS-isoleeritus    | Tõestatud                       |
| Privaatsed väljad               | `#button`, `#onClick`           |
| Atribuudi `sold-out` muutmine   | Nupu tekst ja olek uuenevad     |
| Mooduli range režiim            | `ReferenceError`                |
| `composed: false`               | Sündmus ei jõua `document`-ini  |
| `composed: true`                | Sündmus jõuab lehele            |
| Dünaamiline import              | Moodul laaditakse nupuvajutusel |
| Saaliplaan                      | 216 kohta                       |
