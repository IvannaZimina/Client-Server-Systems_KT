
# C02 — Ülesanne 4: Paigutus, ühikud ja responsiivsus

## 1. Sea box-sizing: border-box kõigele, ka ::before ja ::after.

Lisati universaalne reegel `*`, `*::before` ja `*::after` jaoks. `box-sizing: border-box` arvestab elemendi laiuse sisse ka äärised ja sisemised vahed.

## 2. Kasuta rem-i paigutuses ja em-i seal, kus asi kasvab oma kirjaga.

Paigutuse vahekaugustes kasutatakse `rem`-ühikut. Nuppude sisemistes vahedes kasutatakse `em`-ühikut, mis sõltub elemendi kirjasuurusest.

## 3. Vaheta margin-left ja width loogiliste omaduste vastu.

Kasutati loogilisi omadusi, näiteks `inline-size`, `margin-inline`, `padding-inline` ja `max-inline-size`. Need kohanduvad teksti kirjutamise suunaga.

## 4. Piira rea pikkust ch-ga ja kasuta min()-i, et ta ka kitsal ekraanil peaks.

Teksti rea pikkus piirati omadusega `max-inline-size: 65ch`. Sisu laiuse jaoks kasutati `min()` funktsiooni, et laius ei ületaks määratud maksimumi ega põhjustaks kitsal ekraanil horisontaalset ülevoolu.

## 5. rem-iga saab kasutaja suurema kirja seades suurema LEHE.

Paigutuse suurustes kasutatakse `rem`-ühikut, mis sõltub juurelemendi kirjasuurusest. Kui kasutaja muudab brauseri kirjasuurust, muutuvad ka rem-ühikuga määratud vahekaugused.

## 6. Tee ruudustik auto-fit ja minmax abil, ilma ühegi meediapäringuta.

Sündmuste ja kaartide ruudustikus kasutati `repeat(auto-fit, minmax(...))`. Veergude arv muutub vastavalt vabale ruumile. Selleks ei ole vaja eraldi `@media` reegleid.

## 7. Kasuta subgridi, et kaartide read joonduksid kaartide VAHEL.

Kaartidele määrati `grid-template-rows: subgrid` ja `grid-row: span 3`. Nii saavad sama ruudustiku kaartide sisu read kasutada ühiseid mõõtmeid ja joonduda.

## 8. Anna container-type ÜMBRISELE; @container reegel stiilib tema SEES olevaid kaarte.

Kaartide loendile `.cards` määrati `container-type: inline-size` ja `container-name: cards`. `@container` reegel muudab loendi sees olevate kaartide stiile vastavalt konteineri laiusele. Konteiner ise oma konteineripäringut ei rakenda.

## 9. Arvuta h1 ja h2 clamp() väärtused kaheksal ekraanilaiusel.

Kasutati järgmisi valemeid:

- `h1`: `clamp(1.75rem, 1rem + 2.5vw, 3rem)`
- `h2`: `clamp(1.35rem, 1rem + 1.2vw, 2rem)`

Arvutustes eeldati, et `1rem = 16px`.

| Ekraani laius |             h1 |             h2 |
| ------------: | -------------: | -------------: |
|        320 px | 28,0 px (põhi) | 21,6 px (põhi) |
|        375 px | 28,0 px (põhi) | 21,6 px (põhi) |
|        480 px | 28,0 px (põhi) |        21,8 px |
|        768 px |        35,2 px |        25,2 px |
|       1024 px |        41,6 px |        28,3 px |
|       1280 px | 48,0 px (lagi) |        31,4 px |
|       1440 px | 48,0 px (lagi) | 32,0 px (lagi) |
|       1920 px | 48,0 px (lagi) | 32,0 px (lagi) |

`h1` saavutab minimaalse väärtuse kuni 480 px laiuse juures ja maksimaalse väärtuse alates 1280 px. `h2` saavutab maksimaalse väärtuse alates 1440 px.

Mõlema pealkirja suurus muutub sujuvalt ilma `@media` reegliteta.
