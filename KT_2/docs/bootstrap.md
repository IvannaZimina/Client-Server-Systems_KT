# C02 — Ülesanne 5: Bootstrap ja CSS-i jõudlus

## 1. Sea oma muutujad ENNE esimest @import-i ja kontrolli seda failist üle.

Failis `public/template.scss` määrati Bootstrapi muutujad enne esimest importi. Näiteks `$primary: #0b3d52;`.

Seejärel imporditi Bootstrapi muutujad. Nende `!default` väärtused ei asenda juba määratud väärtusi.

## 2. Impordi ainult need moodulid, mida piletikassa päriselt kasutab.

Imporditi järgmised moodulid:

- `functions`
- `variables`
- `variables-dark`
- `maps`
- `mixins`
- `root`
- `reboot`
- `type`
- `containers`
- `grid`
- `forms`
- `buttons`
- `card`
- `utilities`
- `utilities/api`

Need moodulid võimaldavad kasutada paigutust, vorme, nuppe, kaarte ja abiklasse.

## 3. Loetle üles need, mille sa välja jätsid, ja põhjenda iga otsust.

Järgmised moodulid jäeti importimata:

| Moodul         | Põhjus                                                  |
| -------------- | ------------------------------------------------------- |
| `accordion`    | Kokkupandavaid sisupaneele ei kasutata.                 |
| `alert`        | Eraldi teavituste komponente pole vaja.                 |
| `badge`        | Märgiseid ei kasutata.                                  |
| `breadcrumb`   | Lehel pole navigeerimistee komponenti vaja.             |
| `button-group` | Nuppude gruppe ei kasutata.                             |
| `carousel`     | Sündmuste kuvamiseks pole karusselli vaja.              |
| `close`        | Sulgemisnuppu pole eraldi vaja.                         |
| `dropdown`     | Rippmenüüde jaoks pole eraldi komponenti vaja.          |
| `list-group`   | Loendite jaoks kasutatakse oma lahendust.               |
| `modal`        | Piletikassa ei vaja eraldi modaalaknaid.                |
| `nav`          | Bootstrapi navigeerimiskomponenti ei kasutata.          |
| `navbar`       | Bootstrapi navigeerimisriba ei ole vajalik.             |
| `offcanvas`    | Külgpaneeli ei kasutata.                                |
| `pagination`   | Lehekülgede kaupa navigeerimist pole vaja.              |
| `placeholders` | Laadimise ajal asendusplokke ei kasutata.               |
| `popover`      | Hüpikpaneele ei kasutata.                               |
| `progress`     | Edenemisriba pole piletikassa jaoks vajalik.            |
| `spinners`     | Laadimisindikaatorit pole vaja.                         |
| `tables`       | Andmete kuvamiseks ei kasutata Bootstrapi tabeleid.     |
| `toasts`       | Teavituste jaoks pole Bootstrapi toast-komponenti vaja. |
| `tooltip`      | Vihjetööriistu ei kasutata.                             |
| `transitions`  | Eraldi Bootstrapi üleminekuid ei kasutata.              |

## 4. Nimeta üks koht, kus kohandamine LÕPEB ja tuleb ise ehitada.

Bootstrap pakub valmis vorme, nuppe, kaarte ja paigutuskomponente. Kui projekt vajab spetsiaalset piletivaliku või kohtade paigutuse lahendust, tuleb see ise ehitada. Sellist konkreetset komponenti Bootstrap ei paku.

## 5. VIHJE: muutuja muutmine on odavam kui reegli ülekirjutamine.

Bootstrapi värve ja muid kujundusväärtusi muudeti Sass-i muutujate kaudu enne importi. Nii kasutatakse samu väärtusi raamistiku genereeritud stiilides. See vähendab vajadust hiljem CSS-reegleid üle kirjutada.

## 6. Tee 5000 kaardiga leht ja mõõda paigutuse aega.

Lehel `public/performance.html` loodi JavaScripti abil 5000 kaarti. Mõõdeti kaartide loomise, DOM-i lisamise ja sellele järgneva paigutuse aega, kasutades `performance.now()` meetodit.

**Mõõdetud tulemus ilma optimeerimiseta:**
- Kaartide arv: 5000
- Aeg: 150.20 ms
- Loendi kõrgus: 213920.38 px

## 7. Lisa content-visibility: auto ja mõõda uuesti.

Kaartidele lisati `content-visibility: auto` ja `contain-intrinsic-size: auto 120px`.

**Mõõdetud tulemus:**
- Kaartide arv: 5000
- Aeg: 82.80 ms
- Loendi kõrgus: 212484.00 px

Optimeerimisega oli mõõdetud aeg 67.40 ms väiksem. Loendi kõrgus muutus, sest `contain-intrinsic-size` võimaldab kasutada veel kuvamata sisule esialgset suurust.

## 8. Mõõda nelja selektori maksumust.

Selektorite päringuid korrati 100 korda. Mõõdeti leitud elementide arvu ja päringu keskmist aega.

| Selektor        | Leitud elemente | Keskmine aeg (ms) |
| --------------- | --------------: | ----------------: |
| `.card`         |            5000 |            0.2130 |
| `div`           |           10011 |            0.6630 |
| `* p`           |            5004 |            0.2720 |
| `#nest .card p` |            5000 |            0.2950 |

Kõige kiirem oli `.card` (0.2130 ms) ja kõige aeglasem `div` (0.6630 ms). Tulemused näitavad, et päringu aeg sõltub selektorist ja lehel olevate elementide arvust.

## 9. Kirjuta docs/bootstrap.md ja selgita, KUMMA arvu peale tasub vaadata.

Kõige olulisem on vaadata 5000 kaardi loomise ja paigutuse aega, mitte ainult üksiku CSS-selektori päringu aega.

Selektorite päringute ajad olid väga väikesed võrreldes kaartide loomise ja DOM-i lisamise ajaga. Seetõttu võib suure hulga elementide puhul anda `content-visibility: auto` märgatavama tulemuse kui üksikute selektorite muutmine.

Selektorite puhul tasub eelistada lihtsamaid ja konkreetsemaid lahendusi. CSS-is kontrollitakse selektorite sobivust üldjuhul paremalt vasakule.
