# Ülesanne 3 — DOM kui puu: olek -> vaade

## 1. Loo olek ÜHE objektina: `events`, `sort`, `dir`, `search`, `loading`

Kõik oleku andmed asuvad ühes objektis:

- `events` — sündmuste massiiv;
- `sort` — sorteerimise väli;
- `dir` — sorteerimise suund;
- `search` — otsingusõna;
- `loading` — laadimise olek.

`setState()` uuendab olekut. `readState()` tagastab oleku koopia, mitte algse objekti viite.

## 2. Kirjuta `forView(state)`: otsi nime JA koha pealt, siis sordi

`forView()` teeb sündmuste massiivist koopia. Seejärel otsib sündmusi nime ja koha järgi ning sordib tulemused valitud välja ja suuna järgi.

Algne `events` massiiv jääb muutumatuks.

## 3. Tagasta tuletisest KAKS asja: `rows` ja `state`

`forView()` tagastab kaks väärtust:

- `rows` — filtreeritud ja sorditud sündmused;
- `state` — kasutatud olek.

Andmevoog on ühesuunaline:

`state -> forView(state) -> { rows, state } -> draw() -> DOM`

## 4. Joonistaja EI TOHI olekusse vaadata — muidu on üks suund läinud

Olek on andmete allikas ja DOM on selle põhjal loodud vaade.

Etteantud `draw.js` ei filtreeri ega sordi sündmusi. See kasutab valmis `rows` massiivi ja loob selle põhjal DOM-i elemendid.

Olekut ei loeta DOM-ist tagasi.

## 5. VIHJE: tühi tulemus ja laadimine näevad DOM-is ühtemoodi välja

Joonistaja kasutab kolme olekut:

- `loading` — kuvatakse `Laadin sündmusi…`;
- tühi `rows` — kuvatakse `Ükski sündmus ei vasta otsingule.`;
- tulemused olemas — kuvatakse sündmuste arv.

Tühi tulemus ei ole viga. Laadimine ja tühi tulemus on eraldi olekud.

## 6. Mõõda 2000 rida kolmel viisil: tsükkel, `replaceChildren` ja `DocumentFragment`

Mõõdeti 2000 elementi kolmel viisil ja igal meetodil võeti mediaan 7 jooksust. Täpsed väärtused sõltuvad brauserist.

| Meetod                     | Mõõdetud aeg | Võrdlus tsükliga |
| -------------------------- | -----------: | ---------------: |
| Tsükkel + `appendChild`    |      1.72 ms |               0% |
| `replaceChildren(...rows)` |      0.77 ms |      ~55% kiirem |
| `DocumentFragment`         |      1.40 ms |      ~19% kiirem |

Märkus: `replaceChildren` oli selles testis kõige kiirem. Elemendid loodi väljaspool mõõdetud aega. Kõik kolm mõõtmist tehti dokumendiga seotud konteineris. Tulemusi võrreldi protsentides, mitte kordades.

## 7. Tee kümme elementi ja eemalda need tsüklis ELAVAST kollektsioonist

`getElementsByClassName()` tagastab elava HTMLCollectioni.

Elementide eemaldamisel muutub kollektsioon automaatselt. Tsükli ajal jääb iga teine element vahele.

## 8. Korda sama STAATILISE kollektsiooniga ja võrdle, mitu jäi alles

`querySelectorAll()` tagastab staatilise NodeListi.

Kollektsioon ei muutu pärast elementide eemaldamist. Seetõttu saab tsüklis eemaldada kõik kümme elementi.

| Kollektsioon                  | Eemaldati | Jäi alles |
| ----------------------------- | --------: | --------: |
| Elav `getElementsByClassName` |         5 |         5 |
| Staatiline `querySelectorAll` |        10 |         0 |

## 9. Kokkuvõte

Elav kollektsioon muutub DOM-i muudatuste korral automaatselt. Staatiline kollektsioon säilitab algse elementide loendi.

Renderdamise meetodite kiirust võrreldi 2000 rea põhjal. Selles testis oli kõige kiirem `replaceChildren` meetod.
