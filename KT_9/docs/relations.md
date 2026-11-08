
# Ülesanne 4 - Seotud andmed: JOIN või N+1

## 1. Täida baas 2000 sündmusega ja jooksuta kõik kolm varianti

Testbaas täideti 2000 sündmusega. Koos olemasoleva sündmusega oli kokku 2001 sündmust.

Käivitasin kõik kolm varianti:
- `eventsN1(pool, counter)`
- `eventsJoin(pool)`
- `eventsTwoQueries(pool)`

---

## 2. Pane kirja päringute arv ja aeg; arvuta, mitu korda N+1 on aeglasem

### MÕÕDETUD: 2001 sündmust

| Strateegia    | Päringuid |     Aeg |
| ------------- | --------: | ------: |
| N+1           |      2002 | 2984 ms |
| JOIN          |         1 |   11 ms |
| Kaks päringut |         2 |   13 ms |

JOIN on 271,3 korda kiirem kui N+1.
Arvutus: 2984 / 11 = 271,3.

---

## 3. Kontrolli, et kõik kolm annavad SAMA vastuse, mitte ainult sama arvu

Kõik kolm varianti tagastasid sama tulemuse. Kontrollisin andmeid, mitte ainult tagastatud ridade arvu.

---

## 4. Muuda antud päringus seat-i LEFT JOIN tavaliseks JOIN-iks ja vaata, mitu rida kaob

| Päring    | Ridu |
| --------- | ---: |
| LEFT JOIN | 2001 |
| JOIN      |    1 |

`LEFT JOIN` säilitas kõik sündmused. Tavaline `JOIN` jättis alles ainult seotud andmetega sündmuse.
**2000 rida kadus.**

---

## 5. VIHJE: kui N+1 on kiire, on sul liiga vähe ridu — täida baas

2001 sündmuse korral tegi N+1 kokku 2002 päringut ja võttis 2984 ms.
See näitab, et suurema andmemahu korral muutub N+1 probleem nähtavaks. Väikese andmemahu korral võib sama probleem jääda märkamatuks.

---

## 6. Mõõda bloat-iga kasutajat, kellel on 3 tellimust ja 2 korraldatud sündmust: COUNT ja COUNT(DISTINCT) mõlema lapse kohta

Testkasutajal oli 3 tellimust ja 2 korraldatud sündmust.

| Väärtus                  | Tulemus |
| ------------------------ | ------: |
| COUNT(*) ehk counted     |       6 |
| COUNT(DISTINCT order_id) |       3 |
| COUNT(DISTINCT event_id) |       2 |

Tavaline `COUNT(*)` annab tulemuseks 6, sest kahe seotud tabeli ühendamisel tekib 3 × 2 rida.
`COUNT(DISTINCT)` loendab iga tellimuse ja sündmuse ainult ühe korra.

---


## 7. Seleta KAKS asja: mis oleks counted, kui sama kasutaja ei korraldaks ühtki sündmust, ja miks; mitu korda on N+1 sinu masinas aeglasem 10, 100 ja 2000 sündmuse peal ja miks vahe kasvab

Kui kasutajal oleks 3 tellimust ja 0 korraldatud sündmust, oleks `COUNT(*)` väärtus 3.
Põhjus: `LEFT JOIN` säilitab kõik tellimused ka siis, kui seotud sündmust ei leita.
Sündmuse veergude väärtused on sellisel juhul `NULL`.
`COUNT(DISTINCT event_id)` oleks 0.

### N+1 ja JOIN jõudluse võrdlus

| Sündmusi | N+1 päringuid | N+1 aeg | JOIN päringuid | JOIN aeg | N+1 aeglasem |
| -------: | ------------: | ------: | -------------: | -------: | -----------: |
|       11 |            12 |   21 ms |              1 |     4 ms |    5,3 korda |
|      101 |           102 |  787 ms |              1 |    17 ms |   46,3 korda |
|     2001 |          2002 | 2984 ms |              1 |    11 ms |  271,3 korda |

Kõik kolm te
N+1 päringute arv kasvab koos sündmuste arvuga, sest iga sündmuse kohta tehakse eraldi päring. JOIN kasutab ainult ühte päringut.
Vahe kasvab, sest iga lisapäring vajab andmebaasiga eraldi suhtlust.
Suure andmemahu korral muutub N+1 probleem väga aeglaseks.

---

## 8. Kirjuta docs/relations.md koos mõõdetud päringute arvuga

Mõõdetud päringute arv ja ajad on kirjas punktis 2. Kõik kolm strateegiat tagastasid sama tulemuse.
