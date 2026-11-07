# Ülesanne 4 - Päringu jälgimine DevToolsiga

Uuritud leht: https://www.ut.ee/et    Kuupäev: 08.09.2026

| Näitaja         | Väärtus                   |
| --------------- | ------------------------- |
| Päringuid kokku | 51                        |
| Ülekantud maht  | 2.5 MB (ressursid 4.3 MB) |

| Kood | Arv | Mida tähendab                                                                                          |
| ---- | --- | ------------------------------------------------------------------------------------------------------ |
| 200  | 51  | OK – päring õnnestus, sisu laaditi edukalt (osa päringutest kasutas serveri/Cloudflare vahemälu).      |
| 304  | 0   | Not Modified – antud laadimisel ei esinenud, kuna vahemälu oli tühjendatud või ressursid laeti uuesti. |

Suurim üksikpäring: /sites/default/files/styles/ut_content_teaser/public/2026-09/Untitled%20design.png, tüüp: `image/webp`, maht: 257 178 baiti (~257 KB), aeg: 155 ms.

Kolm järeldust:
1. **Veebilehe laadimine koosneb paljudest eraldiseisvatest päringutest** – üheainsa lehe (`https://www.ut.ee/et`) avamine tekitas koheselt 51 erinevat võrgupäringut (pildid, stiilifailid, skriptid ja fondid).
2. **Piltide ja meedia osakaal on mahult suurim** – suurema osa võrguliiklusest moodustavad graafilised elemendid ja pildid, samas kui HTML-dokument ise on väga väike.
3. **Kliendi ja serveri kommunikatsioon on standardne** – `cURL`-käsu abil tehtud päring terminalist tagastas täpselt sama sisu ja vastuse, tõestades, et brauser ei kasuta serveriga suhtlemisel salajasi või eriõigustega protokolle.