# Ülesanne 6 - SQL, MongoDB ja Firestore kõrvuti

## 1. Kirjuta mongoBackend nii, et see rahuldab C09 Ex3 kuueosalist liidest
`mongoBackend(db)` kasutab samu kuut meetodit nagu C09 Ex3: `findAll`, `readTotal`, `findById`, `add`, `update` ja `remove`.
MongoDB päringud on peidetud adapterisse ning ülejäänud rakendus kasutab ühtset liidest.

---

## 2. Kontrolli, et väljundis EI OLE _id ega ühtki Mongo mõistet
MongoDB dokumentide `_id` teisendatakse rakenduse jaoks väljaks `id`.
Väljad `startsAt` ja `seatCount` teisendatakse vastavalt `starts_at` ja `seat_count`.
Väljundis kasutatakse rakenduse enda väljade nimetusi, mitte MongoDB sisemist struktuuri.

---

## 3. Võrdle, mis KOODIS erineb, kuigi leping on sama
`mongoBackend` kasutab MongoDB meetodeid `find`, `findOne`, `countDocuments`, `insertOne`, `findOneAndUpdate` ja `deleteOne`.
Väljad `_id`, `startsAt` ja `seatCount` teisendatakse rakenduse väljadeks `id`, `starts_at` ja `seat_count`.
SQL-i puhul kasutatakse samade toimingute jaoks SQL-päringuid ning Firestore'i puhul dokumentide ja kogumike meetodeid.
Rakenduse kuus meetodit jäävad kõigi kolme andmebaasi puhul samaks.

---

## 4. VIHJE: üks C09 kontrollidest osutub siin surnud koodiks. Leia ta.
C09 `matchedCount`-kontroll on siin surnud kood.
MongoDB `update` meetod tagastab uuendatud dokumendi või `null`, mitte SQL-i `matchedCount` väärtust. Seetõttu ei saa seda kontrolli samal kujul kasutada.

---

## 5. Tee tabel KAHEKSAST küsimusest kolme andmebaasi kohta

| Küsimus                                       | SQL                                          | MongoDB                                                  | Firestore                                                 |
| --------------------------------------------- | -------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| Kas toetab mitme kirje tehinguid?             | Jah, mitme rea tehingud.                     | Jah, mitme dokumendi tehingud Replica Set-režiimis.      | Jah, oma piirangutega.                                    |
| Kas toetab JOIN-päringuid?                    | Jah.                                         | Otsene JOIN puudub, kasutatakse koondamiskonveierit.     | Ei toeta tavalisi JOIN-päringuid.                         |
| Kas sobib keerukate aruannete jaoks?          | Jah, JOIN-id ja koondfunktsioonid.           | Jah, koondamiskonveieriga.                               | Piiratud võimalused.                                      |
| Kas toetab reaalajakuulajaid?                 | Vajab eraldi lahendust.                      | Change Streams.                                          | Sisseehitatud reaalajakuulajad.                           |
| Kas andmestruktuur on paindlik?               | Skeem on üldjuhul ette määratud.             | Dokumentide struktuur on paindlik.                       | Dokumentide struktuur on paindlik.                        |
| Kas toetab skeemipiiranguid?                  | Jah, andmebaas jõustab piiranguid.           | Ei jõusta neid vaikimisi samal viisil.                   | Ei jõusta neid vaikimisi samal viisil.                    |
| Kas päringutel on piiranguid?                 | Lai päringuvõimaluste valik.                 | Päringud ja koondamiskonveier.                           | Piiratum päringuvõimaluste valik ja päringute tingimused. |
| Kas sobib piletite müügi ja saalivaate jaoks? | Sobib müügi ja kohtade range kooskõla jaoks. | Sobib paindlikuks andmete salvestamiseks ja päringuteks. | Sobib saalivaate reaalajas uuendamiseks.                  |

---

## 6. Kirjuta hybridOk ja migratsioonitee viie sammuna, millest ainult viimane ei ole tagasipööratav
Piletikassa projektis sobib hübriidlahendus: SQL jääb piletite müügi ja kohtade saadavuse ainsaks tõeallikaks.
Firestore saab SQL-ist ühesuunalise sünkroonimise kaudu andmed saalivaate reaalajas kuvamiseks.
`hybridOk` lubab sellise lahenduse ainult siis, kui algallikaid on üks ja sünkroonimine toimub ühes suunas.

Migratsioonitee:
1. Kaardistada SQL-i sündmuste, kohtade ja tellimuste tabelid ning nende seosed.
2. Luua Firestore'is saalivaate jaoks vajalikud kogumikud ja dokumendid.
3. Kopeerida SQL-ist vajalikud andmed Firestore'i ning kontrollida kirjete arvu ja kohtade olekut.
4. Käivitada ühesuunaline sünkroonimine SQL-ist Firestore'i ning kontrollida uue lahenduse tööd. Vana lahendus jäetakse alles, et vajadusel oleks võimalik tagasi pöörduda.
5. Kustutada vana lahendus alles pärast uue lahenduse kontrollimist.

---

## 7. Seleta KOLM asja: miks lukk elab repositooriumis; miks kaks algallikat lähevad lahku; miks vana andmebaas kustutatakse viimasena
- **Lukk elab repositooriumis**, sest kohtade müügi kontroll ja muutmine peavad toimuma ühe tervikliku operatsioonina. Nii välditakse sama koha müümist mitmele ostjale.
- **Kaks algallikat lähevad lahku**, sest mõlemas andmebaasis võivad samad andmed muutuda erinevalt. Ühesuunaline sünkroonimine ühest allikast aitab säilitada ühe tõe.
- **Vana andmebaas kustutatakse viimasena**, sest uue lahenduse kontrollimise ajal peab säilima võimalus vana andmebaasi juurde tagasi pöörduda. Kustutamine on pöördumatu samm.