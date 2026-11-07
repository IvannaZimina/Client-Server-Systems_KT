# Ülesanne 4 — Sündmused ja delegeerimine

## 1. Üks `click`-kuulaja elemendil `#events`

Sündmuste nimekirjale lisati üks `click`-kuulaja.

Delegeerimine võimaldab käsitleda ka uusi nuppe, mis lisatakse DOM-i hiljem. Iga nupu jaoks ei ole vaja eraldi kuulajat lisada.

| Viis                         | Kuulajaid | Uus nupp töötab |
| ---------------------------- | --------: | --------------- |
| Igal nupul eraldi            |       100 | Ei              |
| Delegeeritud kuulaja vanemal |         1 | Jah             |

## 2. Leia `closest("button[data-action]")`

Klõpsatud elemendist otsitakse lähim sobiv nupp meetodiga `closest()`.

Kui sobivat nuppu ei leita, lõpetatakse funktsioon. Nupu `data-action` atribuudi väärtus määrab tegevuse.

## 3. Loe rea ID ja suuna tegevus õigele funktsioonile

Sündmuse rea ID loetakse `data-id` atribuudist.

Nupu `data-action` väärtuse järgi valitakse vastav funktsioon. Nii saab ühe kuulajaga käsitleda erinevaid tegevusi.

## 4. Sündmuse faaside mõõtmine

`capture-tool.js` abil jälgiti sündmuse liikumist kolmes faasis.

Klõpsu oodatav järjekord:

```text
capture #events
capture li
target button
bubble li
bubble #events
```

Sündmus liigub kõigepealt ülevalt alla ja seejärel alt üles.

## 5. `event.target` ja `event.currentTarget`

`event.target` näitab elementi, millel klõpsati.

`event.currentTarget` näitab elementi, millele kuulaja on lisatud.

Delegeerimisel kasutatakse `target`-i klõpsatud nupu leidmiseks ja `currentTarget` näitab kuulaja omanikku.

## 6. Kuula vormi `submit`-sündmust ja kasuta `preventDefault()`

Vorm kuulab `submit`-sündmust, mitte nupu `click`-i.

`event.preventDefault()` takistab vormi tavapärast saatmist ja lehe taaslaadimist.

Enne andmete töötlemist kontrollitakse vormi kehtivust meetodiga `checkValidity()`. Vigase vormi korral kuvatakse vead meetodiga `reportValidity()`.

## 7. Loe väljad `Object.fromEntries(new FormData(form))` abil

Vormi väljad loetakse `FormData` abil ja muudetakse tavaliseks objektiks.

Saadud andmeid kasutatakse otsingu, sorteerimise välja ja suuna uuendamiseks.

Märkimata märkeruut ei kuulu `FormData` tulemusse. Selle väärtuseks ei määrata automaatselt `false`.

## 8. Vormi kontrollimine

`checkValidity()` kontrollib vormi väljade kehtivust.

Kui kontroll ebaõnnestub, käivitatakse `reportValidity()`, mis näitab brauseri veateadet.

Vormi andmeid töödeldakse ainult pärast edukat kontrolli.

## 9. Otsinguvälja `input`-kuulaja 250 ms viivitusega

Otsinguväljal kasutatakse `input`-kuulajat.

Enne uue taimeri käivitamist tühistatakse eelmine taimer. Otsing ja DOM-i uuendamine toimuvad 250 ms pärast viimast sisestust.

See vähendab liigseid renderdamisi kiire kirjutamise ajal.

## Kokkuvõte

Üks delegeeritud kuulaja töötab ka hiljem lisatud nuppudega. `closest()` leiab sobiva nupu ja `data-id` määrab sündmuse ID.

Vormi `submit`-sündmus, `FormData` ja vormi kehtivuse kontroll võimaldavad töödelda vormi andmeid ilma lehte uuesti laadimata.

Otsingu 250 ms viivitus vähendab liigseid uuendamisi.
