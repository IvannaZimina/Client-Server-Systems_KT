# Ülesanne 6 — Teenustöötaja ja võrguta pilet ★★★

### 1. Kirjuta `install`: lae kest vahemällu ja anna vahemälule VERSIOON.

Failis `public/sw.js` registreeritud `install`-sündmuse töötleja avab
`caches.open(VERSION)` abil vahemälu `piletikassa-v3` ja lisab
`cache.addAll(SHELL)` abil viis kestafaili: `/index.html`, `/app.js`,
`/style.css`, `/logo.svg` ja `/manifest.webmanifest`. `event.waitUntil()`
hoiab paigalduse nende failide laadimiseni.

Pärast kõigi viie faili edukat laadimist kutsub töötleja self.skipWaiting().
See tähendab, et uus teenustöötaja saab liikuda aktiveerimise juurde ilma
tavalist ootamist ära ootamata.
---

### 2. Kirjuta `activate`: kustuta KÕIK vanad vahemälud ja võta lehed üle.

`activate` loetleb kõik vahemälud ja kustutab kõik nimed peale aktiivse
`piletikassa-v3`. `clients.claim()` annab uuele teenustöötajale aktiivsed
lehed üle.

event.waitUntil() ootab nii vanade vahemälude kustutamise kui ka
clients.claim() lõpetamist. Nii ei lõpe aktiveerimine enne, kui need
toimingud on tehtud.

---

### 3. Jooksuta proovijooks ja kontrolli, et v1 ja v2 said kustutatud.

Kontroll käivitatakse käsuga `node materials/check-sw.js` kaustas `KT_5`.
Failis `materials/check-sw.js` luuakse enne `activate`-sündmust vahemälud
`piletikassa-v1` ja `piletikassa-v2`. Pärast sündmuse töötleja lõppu annab
`caches.keys()` tulemuseks ainult `["piletikassa-v3"]`, sest vanad vahemälud
on kustutatud.

---

### 4. Seleta, millal `skipWaiting` on ohtlik ja mis selle kesta juures teeb ta ohutuks.

`skipWaiting` on ohtlik, kui uus teenustöötaja võtab avatud lehe üle ajal, mil
leht kasutab vana kesta ressursse. Selles lahenduses avab `install` vahemälu
`piletikassa-v3` ja `cache.addAll(SHELL)` laadib kõik viis faili enne
`event.waitUntil()` lõpetamist vahemällu. `activate` kustutab vanad vahemälud
ja võtab lehed üle. Kontrollskript kinnitas vähemalt viie faili laadimise, kuid
olemasoleva lehe täielikku versioonivahetuse riski `skipWaiting` ise ei kõrvalda.

`cache.addAll(SHELL)` tagab, et kõik viis kestafaili on uues vahemälus olemas,
kui nende laadimine õnnestub. See ei taga siiski, et juba avatud vana leht
suudab uue teenustöötaja versiooniga täielikult ühilduda.

---

### 5. VIHJE: brauser ei kustuta vanu vahemälusid KUNAGI ise.

Brauser ei kustuta Cache API kirjeid automaatselt. Vanad versioonid kustutatakse
teenustöötaja `activate`-s, et kettale ei jääks aegunud rakendusefaile.

---

### 6. Kirjuta `networkFirst()` KOOS ajalõpuga; võrguta tuleb vastus vahemälust.


`networkFirst()` proovib kõigepealt võrku ja kasutab määratud ajalõppu
(vaikimisi 5000 ms). Päringu katkestamiseks kasutatakse `AbortController`-it.

Kui võrgupäring õnnestub ja vastus on edukas, salvestatakse see vahemällu.

Võrguvea, HTTP-vea või ajalõpu korral proovib funktsioon leida vastuse
vahemälust. Kui vastus on olemas, tagastatakse vana versioon.
Kui vahemälu on tühi, visatakse algne viga edasi.

---

### 7. Kirjuta `staleWhileRevalidate()`: vana kohe, uus taustal, tausta viga vaikselt.


`staleWhileRevalidate()` tagastab olemasoleva vastuse kohe, et kasutajaliides
reageeriks kiiresti. Samal ajal laaditakse võrgust uus vastus ja salvestatakse
vahemällu.

Taustal tekkinud võrguviga ei katkesta vana vastuse kuvamist.
Kui vahemälus vastust ei ole, ootab funktsioon võrgupäringu tulemust.
Kui ka võrgupäring ebaõnnestub, visatakse viga edasi.

Täiendav ajalõpu kontroll:
- Testimiseks kasutati eraldi päringut ajalõpuga 100 ms.
- Ajalõpp ja vastus vahemälus: tagastati vahemälu vastus.
- Ajalõpp ja tühi vahemälu: visati AbortError.
- Mõõdetud aeg oli vastavalt 132 ms ja 128 ms.

Tulemused kinnitasid, et ajalõpu korral kasutatakse olemasolevat vahemälu
vastust ning tühja vahemälu korral ei peideta algset viga.

---

### 8. Kirjuta `pick()`: `/api/orders` on võrk-ainult ja seda EI vahemälustata.

`pick()` annab kestale `shell-first` (cache-first),  
sündmuste nimekirjale `network-first`,  
teatud piletile `stale-while-revalidate` ja  
`/api/orders`-ile `network-only`.  
Ostunimekiri sisaldab muutuvaid ja isiklikke andmeid, mida ei tohi vanast vahemälust kuvada.

`fetch`-sündmuse töötleja püüab kinni sama päritoluga GET-päringud,
kutsub `pick()` ja käivitab vastava strateegia.

`/api/orders` puhul kasutatakse ainult võrku. Teisi HTTP-meetodeid
ei salvestata vahemällu ja need suunatakse otse võrku.

Teenustöötaja ei töötle teiste päritolude päringuid. Nii jäävad rakenduse
vahemälustrateegiad rakenduse enda päringute piiridesse.

---

### 9. Kirjuta `docs/service-worker.md`: mida võrguta SAAB ja mida EI SAA.

Teenustöötaja teeb rakenduse võrguta loetavaks, mitte täielikult võrguta
töötavaks. Võrguta saab:
- avada vahemällu salvestatud rakenduse kesta;
- lugeda sündmuste vana versiooni;
- lugeda vahemällu salvestatud pileti andmeid.

Võrguta ei saa:
- kontrollida uue ostu õnnestumist;
- luua usaldusväärset uut tellimust;
- kasutada `stale-while-revalidate`-andmeid vaba kohtade arvu täpseks   näitamiseks, sest andmed võivad olla vananenud.

Sündmuste vana versioon on kättesaadav ainult siis, kui see on varem edukalt
vahemällu salvestatud. Sama kehtib piletiandmete kohta: kui piletit pole
varem salvestatud, ei saa seda võrguta laadida.

Rakenduse kest on võrguta kättesaadav siis, kui install-sündmus on
lõppenud edukalt ja kõik viis kestafaili on vahemällu salvestatud.

---

## Mõõdetud tulemus

## Elutsükkel - mõõdetud

```text
install  -> kest laetud (5 faili), skipWaiting kutsutud
activate -> alles jäi ainult ["piletikassa-v3"]
```

## Kolm strateegiat

| strateegia                | kasutajale            | kasutus            |
| ------------------------- | --------------------- | ------------------ |
| shell-first (cache-first) | kohe                  | kest (5 faili)     |
| network-first             | värsket, võrguta vana | sündmuste nimekiri |
| SWR                       | vana kohe, uus hiljem | üks pilet          |

## Isikuandmed: mis läheb vahemällu ja mis mitte

```text
/api/orders       -> võrk-ainult   (isikuandmed, muutub iga ostuga)
/api/tickets/:id  -> SWR           (ei muutu, uksel vaja võrguta)
```

Kontrollskript andis tulemuseks `19 kontrolli OK`.

Täiendavad networkFirst() testid

Ajalõpp + vahemälu:
Result: { source: 'cache' }
Elapsed: 132 ms

Ajalõpp + tühi vahemälu:
Error: AbortError
Elapsed: 128 ms

Need kaks lisatesti kontrollisid ajalõpu käivitumist, vahemälust varuvastuse
tagastamist ja vea edasiandmist tühja vahemälu korral.