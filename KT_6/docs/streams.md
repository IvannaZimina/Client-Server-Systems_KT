# C06 — Ülesanne 5: Vood ja tagasisurve

### 1. Faili lugemine mällu
Failis `server/streams.js` loodi funktsioon `allInMemory(file)`, mis loeb kogu faili funktsiooniga `fs.readFile()` mällu.
Faili sisu teisendatakse tekstiks ja jagatakse funktsiooniga `split('\n')` eraldi ridadeks.
Tühjad read jäetakse arvestusest välja. Tagastatakse ridade arv.

---

### 2. Faili lugemine voona
Loodi funktsioon `streamRows(file)`, mis kasutab `createReadStream()` ja `readline` moodulit.
Faili loetakse rida haaval ning kogu faili ei laadita korraga mällu.
Tühjad read jäetakse arvestusest välja. Tagastatakse loetud ridade arv.

---

### 3. Mälu kasutamise võrdlus
Kahe lugemisviisi mälukasutust võrreldi 120 MB CSV-faili abil.
Mõlemat meetodit mõõdeti eraldi Node.js protsessis, et eelmise katse mälukasutus ei mõjutaks järgmist mõõtmist.
Mõõdeti RSS-i kasvu megabaitides, võrreldes protsessi mälukasutust enne ja pärast faili lugemist.

Mõõtmistulemused:
| Meetod        | RSS kasv |
| ------------- | -------: |
| `allInMemory` |   515 MB |
| `streamRows`  |    22 MB |

Voogude kasutamisel oli RSS-i kasv 23,4 korda väiksem.
`allInMemory()` kasutab rohkem mälu, sest faili sisu hoitakse korraga mälus Buffer-objektina ja tekstistringina.
Lisaks loob `split()` eraldi stringid iga rea jaoks.
`streamRows()` töötleb andmeid järk-järgult ega pea kogu faili korraga mälus hoidma.

---

### 4. CSV teisendamine Transform-vooga
Funktsioon `csvToRows()` loodi klassi `Transform` abil.
CSV-faili lugemisel ei pruugi üks andmeosa (chunk) sisaldada tervet rida.
Seetõttu säilitatakse pooleli jäänud rea osa muutujas `remainder` ja lisatakse sellele järgmise andmeosa sisu.
Täielikud read jagatakse komade järgi väljadeks. Päiserida jäetakse vahele ning tühjad read jäetakse töötlemata.
Lisaks kontrolliti andmete jagunemist 7-baidisteks osadeks.
Test näitas, et ka siis, kui rida jaguneb mitme andmeosa vahel, saadakse tulemuseks korrektsed CSV-read.

---

### 5. Viimase rea töötlemine
Transform-voo meetodis `flush()` töödeldakse allesjäänud andmed ka siis, kui faili viimane rida ei lõpe reavahetusega.
Nii ei lähe faili lõpus olevad andmed kaduma.

---

### 6. CSV-faili kokkuvõte
Funktsioon `summary(file)` kasutab CSV-andmete lugemiseks `createReadStream()` ja funktsiooni `csvToRows()`.
Andmete töötlemiseks kasutatakse `pipeline()` funktsiooni, mis ühendab faili lugemise, CSV-ridade teisendamise ja tulemuste kogumise.
Arvutatakse andmeridade arv ja piletite koguarv. Päiserida arvestusse ei kuulu.

Testfaili `materials/test.csv` kontrollimisel saadi tulemus:
| Näitaja      | Tulemus |
| ------------ | ------: |
| Ridade arv   |       3 |
| Piletite arv |       6 |

---

### 7. Faili saatmine vastusevoona
Funktsioon `sendAsStream(res, file)` loodi faili saatmiseks vastusevoona.
Kasutatakse `createReadStream()` ja funktsiooni `pipeline()`.
Andmeid edastatakse osade kaupa, ilma et kogu faili oleks vaja korraga mällu laadida.
`pipeline()` hoolitseb voo sulgemise ja vigade edastamise eest.

---

### 8. Tagasisurve käsitlemine
Funktsioon `writeWithBackpressure(writable, chunks)` kirjutab andmeosi Writable-voogu.
Kui `write()` tagastab väärtuse `false`, oodatakse sündmust `drain`, enne kui kirjutamist jätkatakse.
Funktsioon tagastab kirjutatud osade arvu (`chunks`) ja pauside arvu (`pauses`).
Testis kirjutati 200 andmeosa, igaüks 256 baiti. Kokku kirjutati 51 200 baiti ja kirjutamine peatus 50 korda, oodates sündmust `drain`.

---

### Kontrollimise tulemused
Faili `materials/make-big-file.js` abil loodi 120 MB CSV-fail, milles oli 5 991 864 rida.
Mõõdetud RSS-i kasv eraldi protsessides:
| Meetod        |   RSS kasv |
| ------------- | ---------: |
| `allInMemory` |     515 MB |
| `streamRows`  |      22 MB |
| Erinevus      | 23,4 korda |

Faili `server/streams.js` süntaksit kontrolliti käsuga `node --check server/streams.js`. Süntaksivigu ei leitud.
Testfaili `materials/test.csv` põhjal kontrolliti funktsiooni `summary()`. Tagastati 3 rida ja kokku 6 piletit.
CSV teisendamist kontrolliti ka 7-baidiste andmeosadega. Mõlemad CSV-read saadi korrektselt kätte.
Tagasisurve testis kirjutati 200 andmeosa, kokku 51 200 baiti. Kirjutamine peatus 50 korda.
Etteantud kontrollfaili käivitamisel käsuga `node materials/check-streams.js` läbiti kõik 11 kontrolli.
Kontrollimise tulemus: `11 kontrolli OK`.