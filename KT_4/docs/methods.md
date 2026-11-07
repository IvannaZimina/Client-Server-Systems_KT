# Ülesanne 2 - meetodid ja olekukoodid

### 1. Tee tabel: meetod, ohutu, idempotentne, kus teda piletikassas kasutad.

| meetod  | ohutu | idempotentne      | kasutus piletikassas                      |
| ------- | ----- | ----------------- | ----------------------------------------- |
| GET     | jah   | jah               | sündmuste nimekiri või ühe sündmuse vaade |
| HEAD    | jah   | jah               | päiste kontroll ilma kehata               |
| OPTIONS | jah   | jah               | CORS-i eelkontroll                        |
| POST    | ei    | ei                | uue ostu loomine                          |
| PUT     | ei    | jah               | sündmuse muutmine `If-Match` abil         |
| PATCH   | ei    | sõltub toimingust | sündmuse osaline muutmine                 |
| DELETE  | ei    | jah               | ostu tühistamine                          |

Ohutu päring ei muuda serveri olekut. Idempotentse päringu kordamine annab sama lõppseisu, kuigi vastused võivad erineda. PATCH-i idempotentsus sõltub sellest, millist muudatust tehakse.

### 2. Saada sama POST kaks korda ja loe kokku, mitu ostu tekkis.

Alguses oli ostude nimekiri tühi (`[]`). Sama keha saadeti kaks korda:

`POST /api/orders`

Mõlemad päringud tagastasid `201 Created`. Esimese ostu ID oli `1001`, teise ID `1002`.

Pärast päringuid oli nimekirjas 2 ostu. POST ei ole idempotentne, sest iga saatmine loob uue ressursi.

### 3. Saada sama PUT (`If-Match`!) kaks korda: lõppseis on sama.

Kõigepealt küsiti sündmust `GET /api/events/4`. Algne ETag oli `"6c1a736bf30ab724"`.

Sama PUT-päring saadeti kaks korda:

`PUT /api/events/4 {"price":9}`

Esimene päring tagastas `200 OK`. Sündmuse hind muutus 8 eurolt 9 eurole ja ETag muutus väärtuseks `"ce9864843a1d14d2"`.

Teine päring kasutas vana ETag-i ja tagastas `412 Precondition Failed`. Muudatust ei tehtud.

### 4. Seleta ühe lausega, miks GET-tee „…/cancellation“ on ohtlik.

GET peab olema ohutu, kuid `.../cancellation` võib ostu tühistada. Brauser, otsingurobot või lingi eellaadimine võib GET-päringu automaatselt teha ja põhjustada soovimatu olekumuutuse.

### 5. VIHJE: brauser teeb ohutuid päringuid ISE — näiteks lingi eellaadimisel.

Brauser võib teha GET-päringu ise näiteks lingi või lehe eellaadimisel ja eelvaate loomisel. Seetõttu ei tohi olekut muutvat tegevust siduda GET-iga.

### 6. Jooksuta `/api/status/301`, 401, 405 ja 429 ning kirjuta lisapäised üles.

Kasutati käske `curl.exe -i http://localhost:3004/api/status/...`.

Mõõdetud tulemused:

```text
301 -> Location: /api/events
401 -> WWW-Authenticate: Bearer realm="piletikassa"
405 -> Allow: GET, HEAD, OPTIONS
429 -> Retry-After: 5
```

Kõik neli päringut tagastasid vastava HTTP-olekukoodi ja lisapäise.

### 7. Vali kood: märgis on aegunud; korraldaja muudab TEISE korraldaja sündmust.

Vana `If-Match` märgise korral kasutatakse koodi `412 Precondition Failed`. Teise korraldaja sündmuse muutmise korral kasutatakse koodi `403 Forbidden`, sest kasutaja on teada, kuid tal puudub selleks õigus.

### 8. Vali kood iga ülesande esimesel slaidil loetletud olukorra jaoks.

| olukord                         | kood |
| ------------------------------- | ---: |
| nimekirja muutmiskatse          |  405 |
| ei ole sisse logitud            |  401 |
| logitud, aga ei ole korraldaja  |  403 |
| viimane koht müüdi vahepeal ära |  409 |
| liiga palju päringuid           |  429 |
| andmebaas ei vasta              |  503 |

### 9. Seleta, miks 301 on ohtlikum kui 302.

301 tähendab püsivat ümberpaigutamist. Kliendid, brauserid ja vahemälud võivad uue aadressi pikaks ajaks salvestada. 302 tähendab ajutist suunamist ega tähenda ressursi püsivat aadressi muutmist.

**Kontrolli kokkuvõte:** POST lõi kaks eraldi ostu (`1001` ja `1002`). PUT tagastas esmalt `200 OK` ja seejärel vana ETag-i tõttu `412 Precondition Failed`. Kõik neli olekukoodi tagastasid oodatud lisapäised.