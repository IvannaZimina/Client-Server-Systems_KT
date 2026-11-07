# C08 — Ülesanne 1: Reaalaeg, failid ja taustatööd

## 1. Jooksuta mõõteriist ja pane neli rida tabelisse.

### MÕÕDETUD: 3 s aken, 6 muutust, küsitlus iga 250 ms

| viis         | päringuid | baite | teateid | latents |
| ------------ | --------: | ----: | ------: | ------: |
| polling      |        14 |  5236 |       6 |  172 ms |
| long polling |         7 |  2413 |       6 |    1 ms |
| SSE          |         1 |   623 |       6 |    1 ms |
| WebSocket    |         1 |   558 |       6 |    2 ms |

---

## 2. Arvuta, mitu korda polling on kallim ja aeglasem kui SSE.

Polling saatis 5236 baiti, SSE aga 623 baiti.
5236 / 623 = 8,4
Polling kasutas 8,4 korda rohkem baite kui SSE.
Pollingu latents oli 172 ms ja SSE latents 1 ms.
172 / 1 = 172
Polling oli mõõtmise järgi 172 korda aeglasem kui SSE.
250 ms küsitlusintervalli korral võib muudatus tekkida kahe päringu vahel. Sellisel juhul peab klient muudatuse avastamiseks ootama järgmist päringut. Kui muudatused toimuvad küsitluste vahel juhuslikult, võib keskmine ooteaeg olla ligikaudu pool küsitlusintervalli ehk 125 ms.

---

## 3. Võrdle SSE ja WebSocketi BAITE ja selgita, kumb võidab ja miks.

SSE saatis 623 baiti, WebSocket aga 558 baiti.
WebSocket saatis lühema raami päise tõttu 65 baiti vähem. Mõõtmistulemuste põhjal kasutas WebSocket andmete edastamiseks vähem baite.

---

## 4. Vaata mõõteriista koodist, MIKS SSE saadab kohe „retry: 3000“.

Esimene kirjutus `res.write("retry: 3000\n\n")` saadab kliendile HTTP-päised ja avab andmevoo enne esimese sündmuse saabumist.
`retry: 3000` saadetakse kohe, et klient saaks SSE-ühenduse vastuse kätte juba enne esimese sündmuse saabumist.
Samal ajal määratakse automaatse taasühendamise ooteajaks 3 sekundit.

---

## 5. VIHJE: kui polling näitab sama latentsi mis WebSocket, on mõõteriist katki.

Pollingu mõõdetud latents oli 172 ms ja WebSocketi latents 2 ms.
Polling tuvastab muudatused järgmise päringu ajal, WebSocket aga saab teate kohe pärast selle saatmist serverist.
Mõõteriista kontrollimisel arvestati muudatuse tekkimise aega ja küsitluste intervalli, et pollingu latentsi mitte alahinnata.

---

## 6. Tee tabel: suund, ühenduste arv, taasühendus, puhverserver, vahemälu.

| Meetod       | Suund                             | Ühenduste arv                    | Taasühendus                                      | Puhverserver                                       | Vahemälu                                                         |
| ------------ | --------------------------------- | -------------------------------- | ------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------- |
| Polling      | Klient → server                   | Korduvad lühikesed HTTP-päringud | Klient saadab pärast vastust uue päringu         | Tavaline HTTP, üldiselt toetatud                   | GET-vastuseid saab vahemällu salvestada, kui päised seda lubavad |
| Long polling | Klient → server, vastus serverilt | Üks aktiivne päring korraga      | Klient saadab pärast vastuse saamist uue päringu | Toetatud, kuid ajalõpud võivad ühenduse katkestada | Vahemällu salvestamine tuleb keelata                             |
| SSE          | Server → klient                   | Üks püsiv HTTP-ühendus           | EventSource loob ühenduse automaatselt uuesti    | Vajab voogedastuse tuge ja puhverdamise keelamist  | Vahemällu salvestamine tuleb keelata                             |
| WebSocket    | Mõlemas suunas                    | Üks püsiv ühendus                | Tuleb rakenduses ise programmeerida              | Vajab WebSocketi Upgrade-päise tuge                | HTTP vahemälu ei kasutata                                        |

---

## 7. Vali igale piletikassa olukorrale viis ja põhjenda üks lause kohta.

- **Vabade kohtade regulaarne kontrollimine:** Polling – piisab andmete perioodilisest uuendamisest.
- **Makse tulemuse ootamine:** Long polling – server saadab vastuse pärast makse oleku muutumist.
- **Vabade kohtade kuvamine reaalajas:** SSE – server edastab muudatused kliendile.
- **Piletite skannimine mitmes sissepääsus:** WebSocket – skannerid vahetavad serveriga andmeid mõlemas suunas.
- **Kasutajatoe vestlus:** WebSocket – mõlemad osapooled saavad ühe ühenduse kaudu sõnumeid saata ja vastu võtta.

---

## 8. Seleta, miks SSE automaatne taasühendus on tema alahinnatud eelis.

EventSource taastab ühenduse pärast katkestust automaatselt.
`Last-Event-ID` kasutamisel saab server tuvastada viimase kätte saadud sündmuse ja saata vahele jäänud sõnumid uuesti.
WebSocketi puhul tuleb selline loogika ise programmeerida.