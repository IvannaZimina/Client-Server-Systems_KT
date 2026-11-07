
# C02 — Ülesanne 3: Kaskaad, kihid ja disainižetoonid

## 1. Kuuluta viis kihti ühe reaga, enne ühtki reeglit.

Failis `public/layers.css` kuulutati viis kihti ühe reaga:

`@layer base, framework, components, ours, exception;`

Kihtide järjekord määrati enne teisi CSS-i reegleid.

## 2. Pane žetoonid kihti base: pinnad, tekst, jooned, rõhk, samm ja raadius.

Kihis `base` määrati järgmised kohandatud omadused:

- Pinnad: `--surface`, `--surface-muted`.
- Tekst: `--text`, `--text-muted`.
- Jooned: `--line`.
- Rõhk: `--accent`, `--accent-strong`, `--danger`.
- Samm: `--space-1` kuni `--space-6`.
- Raadius: `--radius-small`, `--radius-medium`, `--radius-large`.

## 3. Tee tume teema kolmes astmes: :root, prefers-color-scheme, data-theme.

Teema määrati kolmes astmes:

1. `:root` määrab vaikimisi heleda teema.
2. `@media (prefers-color-scheme: dark)` rakendab tumeda teema, kui kasutaja pole ise teemat valinud.
3. `:root[data-theme="light"]` ja `:root[data-theme="dark"]` rakendavad kasutaja valitud teema.

## 4. Lisa color-scheme, et ka kerimisribad ja väljad teemaga kaasa läheksid.

Lisati `color-scheme: light` ja `color-scheme: dark`. See määrab brauseri juhtelementide värviskeemi ning mõjutab näiteks vormivälju ja kerimisribasid.

## 5. Kasutaja valik peab võitma süsteemi eelistuse.

Kasutaja valiku reeglid `:root[data-theme="light"]` ja `:root[data-theme="dark"]` asuvad samas `base` kihis pärast süsteemi eelistuse reeglit. Seetõttu saab kasutaja enda valitud teema süsteemi eelistusest kõrgema prioriteedi.

## 6. Pane sama .field reegel kihtidesse framework ja ours; vaata, kumb võidab.

Sama `.field` selektor lisati kihtidesse `framework` ja `ours`.

| Kiht      | Selektor | Spetsiifilisus |
| --------- | -------- | -------------- |
| framework | `.field` | 0-1-0          |
| ours      | `.field` | 0-1-0          |

Võidab `ours` kihi reegel, sest see asub kihtide järjekorras hiljem. Mõlema selektori spetsiifilisus on sama. Võitja määrab kaskaadikiht.

## 7. Kasuta :where() lähtestuseks ja :is() rühmitamiseks — arvuta mõlema hind.

`:where(h1, h2, h3)` kasutati pealkirjade lähtestamiseks. Selle spetsiifilisus on alati `0-0-0`.

`:is(h2, h3)` kasutati pealkirjade rühmitamiseks. Selle spetsiifilisus on suurima argumendi spetsiifilisus ehk `0-0-1`.

## 8. Arvuta üheksa valija spetsiifilisus ja pane tabelisse.

Spetsiifilisus arvutati kolme arvuna: ID-valijad, klassi-, atribuudi- ja pseudoklassivalijad, elemendi- ja pseudoelemendivalijad.

| Selektor                          | Spetsiifilisus | Arvutuse selgitus                  |
| --------------------------------- | -------------: | ---------------------------------- |
| `.field` (framework)              |          0-1-0 | Üks klass                          |
| `.field` (ours)                   |          0-1-0 | Üks klass                          |
| `.page .field`                    |          0-2-0 | Kaks klassi                        |
| `:where(h1, h2, h3)`              |          0-0-0 | `:where()` ei lisa spetsiifilisust |
| `:is(h2, h3)`                     |          0-0-1 | Suurima spetsiifilisusega argument |
| `.cards > li :is(h2, h3)`         |          0-1-2 | Üks klass ja kaks elementi         |
| `.cards > li:not(.active)`        |          0-2-1 | Kaks klassi ja üks element         |
| `.error:not(:empty)`              |          0-2-0 | Kaks pseudoklassi                  |
| `:root:not([data-theme="light"])` |          0-2-0 | `:root` ja atribuut                |
| `#purchase .field`                |          1-1-0 | Üks ID ja üks klass                |

`:where()` spetsiifilisus on alati `0-0-0`, ka siis, kui selle sees on ID-valija. `:is()` ja `:not()` võtavad arvesse oma argumentide suurimat spetsiifilisust.

## 9. Kirjuta docs/cascade.md: miks kiht asendab !important-i.

Kaskaadikihid võimaldavad määrata stiilide prioriteedi juba struktuuri tasemel. Tavaliste deklaratsioonide puhul võidab hilisem kiht varasema kihi ka siis, kui mõlema selektori spetsiifilisus on sama.

Näiteks `ours` kiht võidab `framework` kihi `.field` reegli. Selleks ei ole vaja suurendada selektori spetsiifilisust ega kasutada `!important`-i.

`!important` ei kao kaskaadist täielikult. Oluliste deklaratsioonide puhul on kihtide järjekord vastupidine. Seetõttu kasutatakse kihte tavapäraste stiilide prioriteedi määramiseks ja `!important`-i ainult erandjuhtudel.

