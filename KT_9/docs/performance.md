# C09 Ex6 — Jõudlus: indeksid ja EXPLAIN

## 1. Täida baas 2000 sündmusega ja jooksuta EXPLAIN 4 korda

Andmebaasi lisati 2000 ajutist sündmust.
Kokku oli baasis 2001 sündmust, sest üks algne sündmus jäi alles.
Käivitati neli EXPLAIN-päringut:
1. `SELECT id FROM event WHERE name LIKE '%kontsert%'`
2. `SELECT id FROM event WHERE starts_at > '2026-06-01' ORDER BY starts_at LIMIT 10`
3. `SELECT id FROM event ORDER BY price LIMIT 10`
4. `SELECT id FROM event WHERE YEAR(starts_at) = 2026`

---

## 2. Pane kirja type, key ja ridade hinnang iga päringu kohta

| Päring                             | type  | key                 | rows |
| ---------------------------------- | ----- | ------------------- | ---: |
| LIKE '%kontsert%'                  | index | uq_event_name_start | 2001 |
| starts_at > ... ORDER BY starts_at | range | ix_event_starts_at  | 1166 |
| ORDER BY price                     | ALL   | NULL                | 2001 |
| YEAR(starts_at) = 2026             | index | ix_event_starts_at  | 2001 |

Tulemused näitavad, et indeksi olemasolu ei tähenda alati kiiret otsingut.
`type=index` tähendab kogu indeksi läbimist ja `type=ALL` kogu tabeli läbimist.

---

## 3. Võrdle listWRONG ja list aega ning selgita erinevust

2000 ajutise sündmuse mõõtmistulemused:

| Meetod                                        |   Aeg |
| --------------------------------------------- | ----: |
| listWRONG — lehekülgede kaupa jagamine mälus  | 23 ms |
| list — lehekülgede kaupa jagamine andmebaasis | 10 ms |

Andmebaasis tehtud päring oli umbes 2,3 korda kiirem.
`listWRONG` laadib kõik otsingutingimustele vastavad read Node.js-i mällu ja valib vajaliku lehekülje alles seal.
`list` kasutab SQL-päringus `LIMIT` ja `OFFSET`, seega saadetakse rakendusele ainult vajalikud read.
Suure andmemahu korral vähendab selline lahendus mälu kasutamist ning andmebaasi ja rakenduse vahelist andmevahetust.

---

## 4. Kontrolli, et kaks järjestikust lehekülge ei korda ühtki rida

Kontrolliti kahte järjestikust lehekülge, kummalgi 10 rida.
Tulemuseks saadi 20 erinevat ID-d ja korduvaid ridu ei olnud.
Päring kasutab järjestust `ORDER BY starts_at ASC, id ASC`.
Lisavõti `id` tagab täieliku ja stabiilse järjestuse ka siis, kui mitmel sündmusel on sama algusaeg. 
Samuti kontrolliti kursoripõhist lehekülgede lugemist.
Kursor kasutab tingimust `starts_at > ? OR (starts_at = ? AND id > ?)`.
Nii ei jäeta sama algusajaga sündmusi vahele ega korrata eelmise lehekülje viimast rida.

---

## 5. VIHJE: key on täidetud, aga type=index tähendab, et loetakse kõik read

Päringu `LIKE '%kontsert%'` tulemus:
- type = `index`
- key = `uq_event_name_start`
- rows = 2001

Päringu `YEAR(starts_at) = 2026` tulemus:
- type = `index`
- key = `ix_event_starts_at`
- rows = 2001

Mõlemas päringus kasutatakse indeksit, kuid sellest hoolimata tuleb kogu indeks läbi lugeda.
Seega ei tähenda täidetud väli `key` automaatselt tõhusat indeksotsingut.

---

## 6. Tabel viie starts_at tingimuse kohta: indexUsed vastus, EXPLAIN type ja rows

| Tingimus         | SQL-tingimus                                             | indexUsed | EXPLAIN type | rows |
| ---------------- | -------------------------------------------------------- | --------- | ------------ | ---: |
| MONTH funktsioon | `MONTH(starts_at) = 3`                                   | false     | index        | 2001 |
| YEAR funktsioon  | `YEAR(starts_at) = 2026`                                 | false     | index        | 2001 |
| Kuupäevavahemik  | `starts_at >= '2026-03-01' AND starts_at < '2026-04-01'` | true      | range        |  167 |
| Täpne algusaeg   | `starts_at = '2026-03-15 19:00:00'`                      | true      | ref          |  167 |
| Hilisem kuupäev  | `starts_at > '2026-06-01'`                               | true      | range        | 1166 |

`indexUsed` kontrollib, kas indeks aitab otsingut teha.
Tingimuste `MONTH()` ja `YEAR()` korral ei saa indeksit tõhusalt otsinguks kasutada, sest veerule rakendatakse funktsiooni.

---

## 7. Seleta KAKS asja oma mõõtmiste põhjal

**1. Kuidas kirjutada MONTH(starts_at) = 3 ümber ja mitu rida säästetakse?**
Funktsiooni `MONTH()` asemel kasutatakse kuupäevavahemikku: `starts_at >= '2026-03-01' AND starts_at < '2026-04-01'`.
Vana tingimuse EXPLAIN näitas `type=index` ja 2001 rida.
Uue tingimuse EXPLAIN näitas `type=range` ja 167 rida.
Hinnanguliselt loetakse 1834 rida vähem ehk umbes 91,6% vähem.
Vahemik võimaldab kasutada otsinguks indeksit `ix_event_starts_at`.

**2. Miks on koondpäring kiirem kui kolm eraldi päringut?**
Mõõtmistulemused:

| Meetod               |   Aeg |
| -------------------- | ----: |
| Üks koondpäring      |  8 ms |
| Kolm eraldi päringut | 15 ms |

Selle mõõtmise põhjal oli koondpäring umbes 1,9 korda kiirem.
Andmebaas saab kõik näitajad arvutada ühe päringu käigus.
Kolme eraldi päringu korral tuleb päring saata kolm korda ja andmebaasis toimub töötlemine kolm korda.
Koondpäring tagastab viis näitajat: sündmuste koguarv, tulevased sündmused, toimunud sündmused, kohtade koguarv ja keskmine hind.
