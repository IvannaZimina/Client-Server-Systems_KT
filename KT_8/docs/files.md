# C08 Ülesanne 3 — Failide üleslaadimine ja turve

## 1. Genereeri salvestusnimi ise; algset nime EI KASUTA failiteena.

Funktsioonis `safeName()` genereeritakse iga faili jaoks `randomUUID()` abil uus nimi.
Sellele lisatakse failitüübile vastav laiend. Algset failinime kasutatakse eraldi ja seda ei lisata salvestusnime.
---

## 2. Säilita algne nimi eraldi väljana Content-Disposition jaoks.

Algne failinimi säilitatakse eraldi väljal `displayName`.
Seda kasutatakse faili nime näitamiseks allalaadimisel (`Content-Disposition`).
Salvestusnimi ja kasutajale nähtav nimi on seega erinevad.
Failinime töötlemisel eemaldatakse kaldkriipsud `/` ja `\`, jutumärgid ning reavahetused asendatakse alakriipsuga.
See aitab vältida failitee muutmist ja HTTP-päise rikkumist.

---

## 3. Tuvasta tüüp faili esimestest baitidest (allkirjad).

Funktsioon `detectType()` kontrollib faili alguses olevaid baite.

| Faili allkiri                    | Tuvastatud tüüp   |
| -------------------------------- | ----------------- |
| JPEG (`FF D8 FF`)                | `image/jpeg`      |
| PNG (`89 50 4E 47 0D 0A 1A 0A`)  | `image/png`       |
| PDF (`%PDF-`)                    | `application/pdf` |
| WEBP (`RIFF` + 4 baiti + `WEBP`) | `image/webp`      |
| RIFF + WAVE (`.wav`)             | `null`            |
| PHP-skript                       | `null`            |

Tüüp määratakse faili sisu, mitte kliendi saadetud `Content-Type` või laiendi järgi.
Tundmatu sisuga failile tagastatakse `null`.

---

## 4. Nõua, et väidetav tüüp, laiend ja sisu KÕIK klapiksid.

Funktsioon `checkFile()` kontrollib kolme asja: kliendi esitatud tüüpi, faililaiendit ja sisu põhjal tuvastatud tüüpi.
Kõik olemasolevad väärtused peavad omavahel klappima.

| Fail                           | Tulemus  | Põhjus                                           |
| ------------------------------ | -------- | ------------------------------------------------ |
| PNG-sisu, `image/png`, `x.png` | OK       | Tüüp, sisu ja laiend klapivad                    |
| PDF-sisu, `image/png`, `x.png` | KEELATUD | Väidetud tüüp ja laiend ei klapi sisuga          |
| PNG-sisu, `image/png`, `x.jpg` | KEELATUD | Laiend `.jpg` ei klapi PNG-sisuga                |
| JPEG-sisu, `foto.JPEG`         | OK       | `.jpeg` on lubatud JPEG-laiend; suurtähed ei loe |
| PHP-skript nimega `pilt.jpg`   | KEELATUD | Sisu tüüp on tundmatu                            |
| JPEG-sisu, `shell.php`         | KEELATUD | Laiend `.php` ei klapi JPEG-sisuga               |
| Tühi fail                      | KEELATUD | Fail on tühi                                     |
| PNG, `maxBytes = 10`           | KEELATUD | Fail ületab lubatud suuruse                      |

Vaikimisi on maksimaalne failisuurus **10 MiB ehk 10 × 1024 × 1024 baiti**.
Seda saab muuta parameetriga `maxBytes`.

Kui kontrollida ainult sisu, võiks JPEG-sisuga fail nimega `shell.php` kontrollist läbi minna.
Kui kontrollida ainult laiendit, võiks `.jpg` laiendiga PHP-skript läbida.
Seetõttu on vaja kontrollida kõiki kolme väärtust.

---

## 5. VIHJE: RIFF üksi ei ole WEBP — .wav algab samuti RIFF-iga.

WEBP tuvastamisel kontrollitakse nii `RIFF` tunnust faili alguses kui ka `WEBP` tunnust baitidel 8–11.
Ainult `RIFF` tunnusest ei piisa, sest ka WAV-fail algab samamoodi.
Seetõttu tagastab `detectType()` RIFF + WAVE faili puhul `null`, mitte `image/webp`.

---

## 6. Otsusta iga faili kohta: avalik või kaitstud; kes tohib, ütleb antud mayRead.

Funktsioon `accessDecision()` kontrollib välja `isPublic`.
Avalik fail on kõigile loetav. Kaitstud faili puhul kontrollitakse õigusi funktsiooniga `mayRead()`.

| Juhtum                                 | Otsus |
| -------------------------------------- | ----- |
| Avalik fail, anonüümne kasutaja        | Luba  |
| Kaitstud fail, anonüümne kasutaja      | 401   |
| Kaitstud fail, kasutaja ilma õigusteta | 403   |
| Kaitstud fail, faili omanik            | Luba  |
| Kaitstud fail, korraldaja              | Luba  |

Funktsioonis `mayRead()` kontrollitakse, kas faili omanik on sama kasutaja või kas kasutaja roll on `organizer`.
Juhuslik URL ei asenda ligipääsu kontrolli. Kaitstud faili lugemisel tuleb õigusi kontrollida iga päringu korral.

---

## 7. Anna kaitstud failile private, no-store — ta ei tohi puhverserverisse jääda.

Kaitstud failile määratakse alati päis `private, no-store`, ka siis, kui kasutajal on faili lugemisõigus.
Avaliku faili puhul kasutatakse päist `public, max-age=31536000, immutable`.
Avaliku faili nimi sisaldab UUID-d, mistõttu faili uus versioon saab uue nime ja pikaajaline vahemällu salvestamine on sobiv.
Kaitstud faili ei tohi puhverserverisse ega jagatud arvuti vahemällu jätta, sest järgmine kasutaja võib muidu näha eelmise kasutaja faili.

---

## 8. Võrdle kolme hoidlat: skaleerumine, varundus, kes kannab allalaadimist.

Failis `server/files.js` määrati kolme hoidla omadused objektis `STORES`.

| Hoidla        | Skaleerumine | Varundus              | Allalaadimine |
| ------------- | ------------ | --------------------- | ------------- |
| Failisüsteem  | üks server   | eraldi                | sinu server   |
| Andmebaas     | jah          | andmebaasi varukoopia | sinu server   |
| Objektihoidla | jah          | hoidla varukoopia     | otse hoidlast |

Funktsioonis `suggestStore()` valitakse hoidla vastavalt serverite arvule, faili suurusele ja tehingu vajadusele.
- Ühe serveri ja väikese faili korral kasutatakse failisüsteemi.
- Mitme serveri või vähemalt 50 MB faili korral kasutatakse objektihoidlat.
- Kui on vaja tehingut ja fail on kuni 0,1 MB, kasutatakse andmebaasi.

Objektihoidla eelis on see, et faili saab alla laadida otse hoidlast.
Sellisel juhul ei pea fail läbima rakendusserverit ega suurendama selle koormust.
See on eriti kasulik suurte failide ja mitme serveriga süsteemi puhul.

---

## 9. Põhjenda, miks objektihoidla enamasti võidab — ja see EI OLE hind.

1. Mitme rakenduse eksemplari korral saavad kõik kasutada sama hoidlat.
2. Failid laaditakse alla otse hoidlast, seega server ei pea neid ise edastama.
3. Suured failid ei tekita rakendusserverile lisakoormust.
4. Ühe serveri ja väikeste failide jaoks sobib `filesystem`, tehinguga seotud failide jaoks `database` ning mitme serveri ja suurte failide jaoks `object_store`.

Funktsioonis `suggestStore()` on need valikud järgmised:

| Juhtum                             | Valik          |
| ---------------------------------- | -------------- |
| 1 eksemplar, 2 MB                  | `filesystem`   |
| 3 eksemplari, 2 MB                 | `object_store` |
| 1 eksemplar, 50 MB                 | `object_store` |
| 1 eksemplar, 0,1 MB, vaja tehingut | `database`     |

`STORES.object_store.download` väärtus on `otse hoidlast`, teiste hoidlate puhul on allalaadimine `sinu server` kaudu.

---

## Oodatav tulemus

Kontrollimiseks käivitati käsk: `node materials\check-files.js`
Tulemus: **34 kontrolli OK**.