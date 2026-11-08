# Ülesanne 5 - tehingud ja pakktoimingud

## 1. Jooksuta 100 samaaegset buyWRONG-i; loe koht, loendur ja „ok“-d
| Kood     | Kohti | Loendur | „ok“ vastust |
| -------- | ----: | ------: | -----------: |
| buyWRONG |     1 |      99 |           99 |

Tulemuseks oli üks müüdud koht, kuid loendur suurenes 99-ni.
Kõik 100 ostupäringut said vastuse „ok“.

---

## 2. Jooksuta 100 samaaegset buySeat-i ja võrdle kõiki kolme arvu
| Kood    | Kohti | Loendur | „ok“ vastust |
| ------- | ----: | ------: | -----------: |
| buySeat |     1 |       1 |            1 |

Tingimuslik uuendus filtris võimaldas müüa koha ainult ühel ostjal. Loendur ja õnnestunud ostude arv jäid õigeks.

---

## 3. Proovi tehingut üksiku mongod-iga (ILMA --replSet-ita) ja pane veateade SÕNA-SÕNALT kirja
Üksiku MongoDB serveriga prooviti tehingut nii tavalise ühenduse kui ka `retryWrites=false` parameetriga. Mõlemal juhul saadi järgmine veateade:
```text
MongoServerError: This MongoDB deployment does not support retryable writes. Please add retryWrites=false to your connection string.
```

---

## 4. Osta kaks kohta, millest teine on juba müüdud; vaata esimest
Teise koha ostmine ebaõnnestus, sest see oli juba müüdud.
Tehing tühistati ning esimese koha muudatus võeti tagasi. Seega ei jäänud osalist ostu.

---

## 5. VIHJE: veateate pakutud parandus ei pruugi olla tegelik parandus
Parameeter `retryWrites=false` ei lahendanud probleemi, sest üksik MongoDB server ei toeta tehinguid.
Tegelik lahendus oli käivitada MongoDB Replica Set-režiimis parameetriga `--replSet rs0`.

---

## 6. Jooksuta pakk, mille kolmas kirje ei sobitu; vaata, mis alles jäi
`bulkWrite`-i katses sobisid kaks esimest kirjet ja kolmandale dokumendile vastet ei leitud.
Tulemuseks oli `matchedCount = 2` ja `errors = 0`.
Kaks esimest muudatust jäid alles, sest `bulkWrite` ei ole mitme dokumendi ulatuses tehing.

---

## 7. Tee tabel KUUEST reast: pakk versus tehing kuue omaduse kaupa
| Omadus          | Pakk (`bulkWrite`)                       | Tehing (`withTransaction`)              |
| --------------- | ---------------------------------------- | --------------------------------------- |
| Aatomilisus     | Iga dokumendi muudatus on aatomiline     | Kõik muudatused on aatomilised koos     |
| Mitu dokumenti  | Jah                                      | Jah                                     |
| Tagasiveeretus  | Puudub                                   | Võimalik                                |
| Osaline tulemus | Võimalik                                 | Ebaõnnestumisel muudatused tühistatakse |
| Vea korral      | Teised õnnestunud toimingud jäävad alles | Kogu tehing tühistatakse                |
| Kasutus         | Sõltumatud muudatused                    | Omavahel seotud muudatused              |

---

## 8. Seleta KOLM asja: miks üks dokument ei vaja tehingut; miks viskamine on ainus tühistamisviis; miks vabade kohtade arv EI TALU lõppkooskõla
1. Ühe dokumendi muutmine on MongoDB-s aatomiline. Tingimusega `sold: false` filtris saab koha müüa ainult üks ostja, seega pole eraldi tehingut vaja.
2. `withTransaction` käsitleb tavapäraselt lõppevat funktsiooni õnnestumisena. `throw` katkestab tehingu ja käivitab tagasiveeretuse; `false` tagastamine seda ei tee.
3. Vabade kohtade arvu põhjal tehakse ostuotsus. Aegunud arv võib näidata juba müüdud kohta vabana, mistõttu ei sobi siin lõppkooskõla ootamine.

---

## 9. Kirjuta docs/nosql-transactions.md koos kolme mõõdetud reaga
| Mõõtmine                          | Tulemus                             |
| --------------------------------- | ----------------------------------- |
| `buyWRONG` – 100 samaaegset ostu  | 1 koht, loendur 99, 99 „ok“ vastust |
| `buySeat` – 100 samaaegset ostu   | 1 koht, loendur 1, 1 „ok“ vastus    |
| Üksik mongod, `retryWrites=false` | Tehing ebaõnnestus sama veateatega  |
