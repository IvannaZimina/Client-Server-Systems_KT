# C07 — Ülesanne 3: Filter, otsing, sort ja lehekülg

## 1. Kirjuta SORTABLE ja FILTERABLE piletikassa järgi: free (vabad kohad) on ARVUTATUD väli, mida sündmuse real ei ole, ja suund tuleb miinusest (-price), mitte eraldi parameetrist.

Failis `server/query.js` määrati lubatud väljad:
- Sortimine: `start`, `name`, `price`, `free`.
- Filtreerimine: `venue`, `min_price`, `max_price`, `free_at_least`.
Väli `free` arvutatakse väärtuste `seats - sold` põhjal, sest sündmuse kirjes seda välja eraldi ei ole.
Sorteerimise suund määratakse miinusmärgiga, näiteks `-price` tähendab hinna järgi sorteerimist kahanevas järjekorras.
Eraldi suuna parameetrit ei kasutata.

---

## 2. Tundmatu sortimisväli peab andma VEA, mille fields.sort NIMETAB lubatud väärtused — klient näeb kohe, mida tohib.

Failis `materials/check-query.js` kontrolliti funktsiooni `readSort()`.
Sisendiga `sort=password` peab funktsioon vea viskama ja lisama `fields.sort` väljale lubatud sortimisväljade loendi.
Samuti kontrolliti SQL-i laadset sisendit `price; DROP TABLE`, mille funktsioon tagasi lükkas.

---

## 3. Kontrolli antud readPage() lage päringuga ?per=1000000 ja otsusta, kas lagi 100 sobib piletikassa nimekirjale.

Failis `server/read-page.js` on määratud:
- `PAGE_DEFAULT = 20`
- `PAGE_MAX = 100`
Failis `materials/check-query.js` kontrolliti päringut `per=1000000`.
Tulemuseks saadi `per = 100`. Selline piirang sobib piletikassa sündmuste nimekirjale, sest ühe päringuga ei saa küsida liiga palju kirjeid.

---

## 4. Otsusta iga vigase sisendi kohta: viga või vaikeväärtus, ja põhjenda.

Failis `materials/check-query.js` kontrolliti vigaseid lehekülje ja päringu suuruse väärtusi.
| Sisend             | Tulemus           | Põhjendus                                         |
| ------------------ | ----------------- | ------------------------------------------------- |
| `page=abc`         | Vaikeväärtus `1`  | Vigane leheküljenumber ei pea päringut katkestama |
| `per=0`            | Vaikeväärtus `20` | Lehekülje suurus peab olema positiivne            |
| `min_price=abc`    | Viga              | Vigane hind muudaks filtreerimise tulemuse valeks |
| `sort=password`    | Viga              | Lubatud on ainult määratud sortimisväljad         |
| `free_at_least=-5` | Viga              | Vabade kohtade arv ei saa olla negatiivne         |

---

## 5. VIHJE: viska siis, kui vigane väärtus muudaks TULEMUSE valeks.

Failis `materials/check-query.js` kontrolliti funktsiooni `readFilters()` järgmiste sisenditega:
| Kontroll                      | Sisend                | Tulemus                      |
| ----------------------------- | --------------------- | ---------------------------- |
| Koha järgi filtreerimine      | `venue: 'Estonia'`    | `{ venue: 'Estonia' }`       |
| Minimaalne hind               | `min_price: '20'`     | `{ min_price: 20 }`          |
| Vigane hind                   | `min_price: 'abc'`    | Viga väljaga `min_price`     |
| Negatiivne vabade kohtade arv | `free_at_least: '-5'` | Viga väljaga `free_at_least` |
| Tundmatu parameeter           | `password: 'x'`       | Tühi objekt `{}`             |
| Tühi väärtus                  | `venue: ''`           | Tühi objekt `{}`             |

Lisaks kontrolliti, et `createPlan({ min_price: 'abc' })` viskab samuti vea.
Vigane arv põhjustab vea, sest selle filtri vaikne eemaldamine võiks näidata sündmusi, mis ei vasta kasutaja päringule.
Tundmatud parameetrid ja tühjad väärtused jäetakse vahele.

---

## 6. Kirjuta createPlan(), mis ei tea midagi SQL-ist ega mälupõhisest repositooriumist.

Failis `server/query.js` loodi funktsioon `createPlan()`.
See koondab otsingu, filtrid, sortimise ja lehekülje parameetrid üheks objektiks.
Plaan ei sõltu SQL-ist ega andmete salvestamise viisist. Funktsioon `apply()` eksporditakse etteantud failist `materials/plan-apply.js`.

---

## 7. Kontrolli testiga, et antud apply() arvutab kokku ENNE leheküljele lõikamist.

Failis `materials/check-query.js` kontrolliti päringut `per=2&page=1`.
Kontrolli tulemused:
| Näitaja       | Tulemus |
| ------------- | ------: |
| `total`       |       4 |
| `rows.length` |       2 |
| `pages`       |       2 |

Koguarv arvutatakse enne tulemuste jagamist lehekülgedeks. Nii saab klient teada kõigi vastete arvu ja lehekülgede koguarvu.

---

## 8. Kontrolli testiga, et antud apply() sordib STABIILSELT: võrdsete korral otsustab id.

Failis `materials/check-query.js` on ette valmistatud kolme sündmusega testmassiiv.
Kõigi sündmuste hind on `10`, kuid ID-d on `3`, `1` ja `2`.
Test käivitab `createPlan({ sort: 'price' })` ja `apply()` ning kontrollib sorteeritud kirjete ID-sid.
Saadud tulemus: `[1, 2, 3]`.
Kui hind on sama, sorteeritakse kirjed ID järgi kasvavas järjekorras.

---

## 9. Näita, et tühi tulemus annab kokku 0 ja lehti 1, mitte 404.

Failis `materials/check-query.js` kontrolliti otsingut väärtusega `search: 'xyz'` faili `materials/events.json` andmete põhjal.
Test käivitab `createPlan({ search: 'xyz' })` ja `apply()`. Ükski sündmus sellele otsingule ei vasta.
Saadud tulemus:
| Näitaja | Väärtus |
| ------- | ------: |
| `total` |       0 |
| `pages` |       1 |

Tühi otsingutulemus ei põhjusta viga 404, vaid tagastab tühja tulemuste loendi.

---

## Kontrolli tulemus

Käivitati käsk `node check-query.js` kaustas `materials`.
Tulemus: `34 kontrolli OK`.