# C08 — Ülesanne 4: Taustatööd, cron ja idempotentsus

## 1. Idempotentsusvõtme haldus

Failis `server/background-jobs.js` loodi funktsioon `createIdempotency()`.
Võtmeid hoitakse `Map`-andmestruktuuris. Iga võti seotakse päringu sisuga (`hash`) ja selle olekuga.

- `next` — võti on uus ja töö võib alata.
- `running` — sama võtmega töö on juba käimas.
- `repeat` — töö on lõpetatud ja salvestatud vastus tagastatakse uuesti.
- `conflict` — sama võtit kasutatakse erineva päringu sisuga.

Võtmele määratakse kehtivusaeg (`ttl`).

Kontrolliti nelja olukorda:

| Olukord                       | Tulemus                       |
| ----------------------------- | ----------------------------- |
| Uus võti                      | `next`                        |
| Sama võti, sama keha, pooleli | `running`                     |
| Sama võti, sama keha, valmis  | `repeat` + salvestatud vastus |
| Sama võti, erinev keha        | `conflict`                    |

---

## 2. Korduspäringu vastus

Pärast töö lõpetamist salvestatakse vastus funktsiooniga `finish()`.
Sama võtme ja sama sisuga korduspäringu korral tagastatakse salvestatud vastus koos tulemusega.
Töö teist korda ei käivitata.
Kontrollis lõpetati töö vastusega `{ id: 7001 }`.
Korduspäringu tulemus oli `repeat` ja tagastatud vastuse ID oli endiselt `7001`.

---

## 3. Erineva sisuga päring

Kui sama võti saadetakse erineva sisuga, tagastatakse `conflict`. Sellisel juhul ei tagastata vana vastust ega käivitata uut tööd.
Kontrollis kasutati sama võtit `v1` esmalt sisuga `hash-a` ja seejärel sisuga `hash-b`. Teise päringu tulemus oli `conflict`.

**---**

## 4. Ebaõnnestunud töö võti

Funktsioon `abort()` eemaldab ebaõnnestunud poolelioleva töö võtme. Sama võtit saab seejärel uuesti kasutada ja päringut korrata.
Kontrollis vabastati võti `v2` funktsiooniga `abort()`. Järgmisel päringul tagastati uuesti `next`, mitte `running`.

---

## 5. Võtme aegumine

Võti saadakse kliendilt ja seda kasutatakse päringu korduvuse tuvastamiseks.
Kui võtme kehtivusaeg on möödunud, eemaldatakse vana kirje ning sama võtmega saab alustada uut tööd.
Kontrollis kasutati `ttl` väärtust 5000 ms.
Pärast kellaaja edasiliigutamist 10 000 ms võrra loeti vana võti aegunuks ja tulemus oli `next`.

---

## 6. Tööde järjekord ja korduskatsed

Funktsioon `createQueue()` loob tööde järjekorra. Tööd lisatakse funktsiooniga `add()` ning neid käivitab `process()`.

- Tööd töödeldakse järjekorras.
- Eduka töö tulemus salvestatakse.
- Ebaõnnestunud tööd proovitakse uuesti käivitada.
- Maksimaalne katsete arv on vaikimisi 3.
- Pärast kolme ebaõnnestunud katset liigub töö surnukirjade nimekirja (`dead`).

Surnud töö kohta säilitatakse vea kirjeldus ja katsete arv.
Järjekorra olekut saab kontrollida funktsioonidega `pending()`, `done()` ja `dead()`.
Kontrollis töödeldi kahte edukat tööd (`email` ja `pdf`).
Mõlemad lõpetati edukalt ning järjekorda ei jäänud ootel töid.

Ebaõnnestunud töö puhul simuleeriti SMTP viga (`SMTP maas`). Töö käivitati kolm korda.
Pärast kolmandat ebaõnnestumist seda enam ei korratud, vaid see lisati surnukirjade nimekirja.
Tulemuseks oli üks surnud töö, kolm katset ja tühi ootel tööde järjekord.

**---**

## 7. E-kirja lisamine järjekorda

Funktsioon `mailJob()` loob e-kirja töö kirje.
Kirje sisaldab saaja aadressi, sündmuse nimega seotud teemat ja ostuga seotud korduvusvõtit kujul `email:order:<order.id>`.
Sama korduvusvõtmega tööd ei lisata järjekorda teist korda.
SMTP vea korral käsitleb järjekord ebaõnnestunud tööd korduskatsena, nii et ostu töötlemine ei sõltu kirja kohesest saatmisest.
Kontrollis loodi e-kiri ostule ID-ga `7001`.
Saajaks määrati `mari@example.ee`, teema sisaldas sündmuse nime `Sügiskontsert` ja korduvusvõtmeks määrati `email:order:7001`.
Sama korduvusvõtmega teist tööd järjekorda ei lisatud.
SMTP tõrget kontrolliti järjekorra korduskatsete kaudu, mitte tegeliku e-kirja saatmisega.

---

## 8. Ajaakna võti

Funktsioon `windowKey()` moodustab võtme töö nime ja ajaakna numbri põhjal.
Sama tunni sees saadakse sama võti, järgmises tunnis aga uus võti.
See võimaldab cron-tööd sama ajaakna jooksul mitu korda käivitada ilma sama töö korduvaks tuvastamiseks erinevat võtit loomata.
Kontrollis võrreldi kolme ajahetke:
- Algusaeg ja 30 minutit hiljem andsid sama võtme.
- 62 minutit hiljem saadi juba erinev võti.

---

## 9. Aegunud hoidude vabastamine

Funktsioon `releaseExpiredHolds()` kontrollib hoidude olekut ja aegumisaega.
- Aegunud `pending` olekus hoid muudetakse olekusse `expired`.
- `purchased` olekus hoid jääb muutmata ka siis, kui aegumisaeg on möödunud.
- Tulevikus aeguv hoid jääb muutmata.
- Teistkordsel käivitamisel juba vabastatud hoidu uuesti ei muudeta.

Kontrollis kasutati nelja hoidu:

| Hoid | Algne olek  | Aegumisaeg | Tulemus      |
| ---- | ----------- | ---------- | ------------ |
| 1    | `pending`   | Möödunud   | Vabastati    |
| 2    | `pending`   | Tulevikus  | Jäi muutmata |
| 3    | `purchased` | Möödunud   | Jäi muutmata |
| 4    | `expired`   | Möödunud   | Jäi muutmata |

Esimese käivitamise tulemus oli `[1]`. Teise käivitamise tulemus oli `[]`, sest vabastatud hoidu uuesti ei muudetud.
Seega kontrollitakse nii hoidude olekut kui ka aegumisaega.

---

**Kontrollimiseks käivitati käsk:**
```cmd
node materials\check-background-jobs.js
```
**Tulemus: 31 kontrolli OK.**