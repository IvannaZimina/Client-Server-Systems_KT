# C02 — Ülesanne 6: Nõuded ja arhitektuuri valik

## 1. Kirjuta ühe lausega, mida rakendus teeb, ja kolm asja, mis peavad õnnestuma.

Rakendus võimaldab kasutajal leida sündmusi, valida kohti, osta pileteid ja kasutada piletit sissepääsul.

Olulised tegevused:
- Sündmuste vaatamine ja sobiva sündmuse leidmine.
- Vaba koha valimine ja pileti ostmine.
- Ostetud pileti kontrollimine sissepääsul.

## 2. Kirjelda kolm rolli ja ütle, milline neist EI OLE konto liik.

| Roll           | Õigused ja tegevused                            |
| -------------- | ----------------------------------------------- |
| Kasutaja       | Vaatab sündmusi, valib kohti ja ostab pileteid. |
| Korraldaja     | Haldab enda loodud sündmust ja selle pileteid.  |
| Süsteemihaldur | Haldab toimumiskohti ja nende üldandmeid.       |

Korraldaja ei ole eraldi konto liik. See on seos kasutaja ja sündmuse vahel: sündmuse looja on selle sündmuse korraldaja. Sama inimene võib ühe sündmuse puhul olla korraldaja ja teise sündmuse puhul tavaline ostja.

Kasutaja õigused korraldajana kehtivad ainult tema enda sündmuse ulatuses. Süsteemihalduri õigused on globaalsed, kuid piirduvad toimumiskohtade haldamisega.

## 3. Järjesta funktsioonid tähtsuse järgi ja põhjenda esimest nelja.

1. **Sündmuste vaatamine ja otsimine.** Kasutaja peab leidma sobiva sündmuse enne pileti ostmist.
2. **Sündmuse ja vaba koha valimine.** Kasutaja peab nägema, millised kohad on saadaval, ning saama valida sobiva koha.
3. **Pileti ostmine ja maksmine.** Valitud koht tuleb ostu ajaks ajutiselt hoida ning edukas makse peab looma pileti. Sama kohta ei tohi müüa kahele ostjale.
4. **Pileti kontrollimine sissepääsul.** Süsteem peab kontrollima pileti kehtivust ja takistama sama pileti korduvat kasutamist.

Need neli funktsiooni moodustavad ühe tervikliku kasutaja teekonna: sündmusele tullakse, valitakse koht, makstakse ja sisenetakse piletiga.

Muud funktsioonid:
5. Korraldaja saab luua ja muuta enda sündmusi.
6. Korraldaja saab vaadata enda sündmuse müügiandmeid.
7. Süsteemihaldur saab hallata toimumiskohti ja saaliplaane.
8. Kasutaja saab vaadata enda ostetud pileteid.
9. Süsteem vabastab aegunud kohahoidud automaatselt.

## 4. Joonista andmete üldpilt: olemid ja seosed, ilma veergudeta.

Andmemudel koosneb järgmistest olemistest ja seostest:

```text
Kasutaja
   |
   +---- loob ---- Sündmus ---- toimub ---- Toimumiskoht
                       |                         |
                       |                         |
                       |                    Saaliplaan
                       |                         |
                       |                        Koht
                       |
                       +---- Hinnaklass
                       |
                       +---- Ost ---- Pilet ---- Koht
                                  |
                                  +---- Sissepääs

Kohahoid:
Koht + Ostja + Aegumisaeg
```

Sündmuse looja on selle sündmuse korraldaja. Sündmus toimub kindlas toimumiskohas. Toimumiskohal on saaliplaan, mis sisaldab kohti. Sündmusega on seotud hinnaklassid ja ostud. Ost sisaldab pileteid ning iga pilet on seotud konkreetse kohaga. Sissepääs on seotud piletiga.

Kohahoid on eraldi olem. See seob valitud koha ostjaga ja sisaldab aegumisaega. Kohahoid ei ole ostu staatus. See on ajutine broneering, mille abil välditakse sama koha samaaegset ostmist. Aja möödumisel vabastatakse koht uuesti müüki.

## 5. VIHJE: esimesed neli funktsiooni on ÜKS lugu — tule, vali, maksa, sisene.

Esimesed neli funktsiooni moodustavad ühe protsessi:

1. Kasutaja leiab sündmuse.
2. Kasutaja valib vaba koha.
3. Koht hoitakse ajutiselt kinni, kasutaja maksab ja süsteem väljastab pileti.
4. Sissepääsu juures kontrollitakse piletit ning märgitakse see kasutatuks.

Iga etapp sõltub eelmisest. Näiteks ei saa väljastada kehtivat piletit, kui ost ei ole edukalt lõpule viidud.

## 6. Võrdle kolme mudelit: kes hoiab andmeid ja kes otsustab.

| Mudel             | Kes hoiab andmeid? | Kes otsustab? | Sobivus                                                                        |
| ----------------- | ------------------ | ------------- | ------------------------------------------------------------------------------ |
| Monoliit          | Üks masin          | Üks programm  | Võimalik väikese kohaliku rakenduse puhul, kuid piiratud mitme kasutaja tööga. |
| Partnervõrk (P2P) | Iga osaleja        | Iga osaleja   | Ei sobi ühise piletimüügi jaoks.                                               |
| Klient-server     | Keskne server      | Server        | Sobib, sest kõik kasutajad töötavad ühiste andmetega.                          |

## 7. Näita, MILLINE nõue sunnib klient-serverit — nimeta ta.

Klient-serveri arhitektuuri nõuab **andmete tervikluse ja samaaegse piletimüügi nõue**.

Mitu kasutajat võivad valida samal ajal sama koha. Süsteem peab tagama, et koht saab olla korraga ainult ühe kehtiva kohahoiu või ostu all. Samuti peab ostu ja makse tulemus olema kõigile kasutajatele ühtemoodi nähtav.

Seetõttu peab kohtade saadavuse, kohahoidude, ostude ja piletite üle otsustama üks keskne server. Nii välditakse topeltmüüki ja vastuolulisi andmeid.

## 8. Ütle, millal p2p oleks õige valik, ja miks siin ei ole.

P2P sobiks näiteks failide jagamiseks või olukorda, kus osalejad saavad andmeid otse üksteisega vahetada ning keskne andmehoidla pole vajalik.

Piletikassa puhul ei sobi P2P, sest kõigil osalejatel peab olema sama info vabade kohtade, ostude ja piletite kohta. Kui iga osaleja otsustaks ise, võiks sama koha osta mitu inimest. Keskne server on vajalik ühise ja usaldusväärse andmeseisu hoidmiseks.

## 9. Loetle, mida kaasaegne CSS selles kontrolltöös JavaScripti asemel tegi.

CSS-i abil lahendati järgmised ülesanded:

- `@layer` abil määrati stiilide kihtide järjekord.
- `:where()` ja `:is()` abil lihtsustati selektoreid ja nende spetsiifilisust.
- CSS-i muutujatega loodi ühised kujundusväärtused ehk design token'id.
- `prefers-color-scheme` abil toetati kasutaja süsteemi heledat ja tumedat teemat.
- `data-theme` abil võimaldati valida kujundusteema.
- `color-scheme` abil kohandati vormielementide välimust vastavalt teemale.
- Meedia- ja konteineripäringute abil kohandati paigutust ekraani ja konteineri suuruse järgi.
- `content-visibility: auto` abil vähendati suure hulga kaartide kuvamisega seotud tööd.

Need lahendused ei vaja eraldi JavaScripti koodi, sest vastavad võimalused on CSS-is olemas.
