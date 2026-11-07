
# C02 — Ülesanne 2: Ostuvorm ja valideerimine

## 1. Ehita purchase.html: kaks fieldset-i legendiga, kaheksa välja.

Failis `public/purchase.html` loodi piletite ostuvorm kahe `fieldset` elemendiga:

- `Ostja andmed` — nimi, e-posti aadress, e-posti kordus ja telefon.
- `Tellimuse andmed` — sündmus, piletite arv, sooduskood ja märkus korraldajale.

Vorm sisaldab kokku kaheksat välja.

## 2. Igal väljal label+for, name ja aria-describedby oma veakastile.

Kõigile kaheksale väljale lisati:
- `label` koos vastava `for` atribuudiga;
- unikaalne `id` ja `name`;
- `aria-describedby` koos abiteksti ja veakasti ID-dega;
- eraldi `span` element veateate jaoks.

Veakastid kasutavad `role="alert"` atribuuti.

## 3. Lisa piirangud: required, type, minlength, min, max, step, pattern.

Väljade valideerimiseks lisati järgmised piirangud:

| Väli            | Piirangud                                                     |
| --------------- | ------------------------------------------------------------- |
| Nimi            | `required`, `type="text"`, `minlength="2"`, `maxlength="80"`  |
| E-posti aadress | `required`, `type="email"`                                    |
| E-posti kordus  | `required`, `type="email"`                                    |
| Telefon         | `type="tel"`, `pattern`                                       |
| Sündmus         | `required`, `select`                                          |
| Piletite arv    | `required`, `type="number"`, `min="1"`, `max="6"`, `step="1"` |
| Sooduskood      | `type="text"`, `pattern`                                      |
| Märkus          | `maxlength="300"`                                             |

Telefon, sooduskood ja märkus on valikulised väljad.

## 4. Pane vormile novalidate ja veakastid alati DOM-i, ka tühjana.

Vormile lisati `novalidate` atribuut, et kasutada brauseri automaatsete hüpikteadete asemel oma veateateid.

Kõikide väljade veakastid on HTML-is olemas ka enne valideerimist. Tühjad veakastid täidetakse JavaScripti abil ainult vea tekkimisel.

## 5. VIHJE: novalidate lülitab välja HÜPIKTEATED, mitte valideerimise.

`novalidate` ei eemalda HTML-i valideerimisreegleid ega `ValidityState` võimalusi.

JavaScript kontrollib väljade kehtivust `ValidityState` abil ning kasutab brauseri valideerimistulemusi veateadete kuvamiseks.

## 6. message(): loe ValidityState lipud ja anna päris arv, mitte üldlause.

Failis `public/validation.js` loodi eksporditav funktsioon `message(field)`.

Funktsioon kontrollib järgmisi `ValidityState` lippe:

- `valueMissing`
- `typeMismatch`
- `patternMismatch`
- `tooShort`
- `tooLong`
- `rangeUnderflow`
- `rangeOverflow`
- `stepMismatch`
- `customError`

Veateate tekstis kasutatakse välja tegelikke piiranguväärtusi, näiteks minimaalset tähemärkide arvu ja lubatud maksimaalset väärtust.

## 7. show() kirjutab veakasti ja aria-invalid, tühjendab paranduse järel; checkMatch() võrdleb kaht e-posti setCustomValidity-ga.

Loodi kaks funktsiooni:

- `show(field)` kuvab vea vastavas veakastis ja lisab väljale `aria-invalid="true"`. Kehtiva väärtuse korral kustutatakse veateade ja atribuut.
- `checkMatch(a, b)` võrdleb kahte e-posti aadressi. Erinevate aadresside korral kasutatakse `setCustomValidity()` meetodit, et määrata kohandatud veateade.

Väljade sündmuste käsitlemiseks kasutatakse etteantud `validation-api.js` faili. Veateade kuvatakse väljalt lahkumisel (`blur`) ja eemaldatakse pärast vea parandamist (`input`).

## 8. Saatmisel: peata, näita kõik vead ja vii fookus ESIMESE vea peale.

Failis `validation.js` lisati vormi `submit` sündmuse käsitleja.

- Vormi tavapärane saatmine peatatakse `preventDefault()` abil.
- Kontrollitakse e-posti aadresside vastavust.
- Kontrollitakse kõiki vormi välju.
- Kuvatakse kõik leitud veateated.
- Fookus viiakse esimesele vigasele väljale.

Kui kõik väljad on korrektsed, kuvatakse teade, et vorm on kontrollitud. Serveriga ühendust ei looda.

## 9. Kirjuta docs/purchase-form.md: message() juhtumid ja :invalid vs :user-invalid.

### message() kontrollitud juhtumid

| Juhtum                                | Oodatav teade                                |
| ------------------------------------- | -------------------------------------------- |
| Tühi kohustuslik väli                 | `See väli on kohustuslik.`                   |
| Vale e-posti kuju                     | `Kontrolli kuju. Sisesta korrektne väärtus.` |
| `minlength="2"` ja liiga lühike tekst | `Vähemalt 2 tähemärki.`                      |
| `max="6"` ja liiga suur väärtus       | `Suurim väärtus on 6.`                       |
| Vale telefoninumber                   | `Kontrolli kuju. Näiteks +372 5123 4567.`    |
| Erinevad e-posti aadressid            | `E-posti aadressid ei kattu.`                |
| Tundmatu valideerimisviga             | Brauseri enda veateade                       |

Kui korraga esinevad `valueMissing` ja `typeMismatch`, kuvatakse esimesena kohustusliku välja teade.

### :invalid ja :user-invalid erinevus

| Valija          | Millal kehtib                                                 |
| --------------- | ------------------------------------------------------------- |
| `:invalid`      | Kohe lehe avamisel, kui väli ei vasta valideerimisreeglitele  |
| `:user-invalid` | Pärast kasutaja suhtlust väljaga, kui väli on endiselt vigane |

Vormi kujundamisel kasutatakse `:user-invalid` valijat, et tühjad kohustuslikud väljad ei muutuks punaseks kohe lehe avamisel.
