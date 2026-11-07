# Sulgpalliklubi — Klient-server süsteemid

Praktikumide ja kontrolltööde repositoorium kursuse "Klient-server süsteemid" raames.

## Sisukord
1. Ülesanne 1: Arenduskeskkond töökorda
2. Ülesanne 2: Vastutuse jaotus
3. Ülesanne 3: URL lahti võetud
4. Ülesanne 4: Päringu jälgimine DevToolsiga
5. Ülesanne 5: Klubi esileht ja otsinguvorm

---

### Ülesanne 1: Arenduskeskkond töökorda
* **Kirjeldus:** Paigaldati vajalikud tööriistad (Node.js LTS, npm, Git) ja loodi projektikaust koos algse Git repositooriumiga.
* **Fail:** `keskkond.txt` (sisaldab käskude väljundeid, nime ja kuupäeva).

### Ülesanne 2: Vastutuse jaotus
* **Kirjeldus:** Analüüsiti sulgpalliklubi rakenduse 12 erinevat osa ning otsustati, kas need kuuluvad kliendile, serverile või mõlemale. Lisaks toodi välja kolm asja, mis ei tohi kunagi kliendini jõuda, ja kolm rünnakut, mis töötavad ainult siis, kui kontroll on tehtud üksnes kliendis.
* **Fail:** `vastutus.md`

### Ülesanne 3: URL lahti võetud
* **Kirjeldus:** Võeti koost lahti kolm erinevat veebiaadressi (URL), määrates nende skeemi, hosti, pordi, tee, päringustringi ja fragmendi. Samuti analüüsiti, millised osad jõuavad serverini (ning tõestati, et fragment jääb puhtalt brauserisse).
* **Fail:** `urlid.md`

### Ülesanne 4: Päringu jälgimine DevToolsiga
* **Kirjeldus:** Avati veebileht `ut.ee`, jälgiti brauseri DevToolsi Network-paneeli kaudu päringute arvu, mahte ja staatuskoode (200, 304) ning testiti sama päringu tegemist käsurealt `cURL` abil.
* **Fail:** `leiud.md` (sisaldab tulemusi ja kolme järeldust).

### Ülesanne 5: Klubi esileht ja otsinguvorm
* **Kirjeldus:** Ehitati sulgpalliklubi semantiline HTML5 esileht (sisseehitatud stiilidega), mis sisaldab mängukordade tabelit ja otsinguvormi (GET ja POST meetoditega, erinevate sisendväli tüüpidega, labelite ja name-atribuutidega). Vormi käitumist testiti ja tulemused dokumenteeriti.
* **Failid:** `index.html`, `vastus.txt`

==================================================

# Sulgpalliklubi — Client-Server Systems

Repository for practical assignments and projects for the "Client-Server Systems" course.

## Table of Contents
1. Task 1: Environment Setup
2. Task 2: Responsibility Distribution
3. Task 3: Dissected URLs
4. Task 4: Network Tracking with DevTools
5. Task 5: Club Homepage and Search Form

---

### Task 1: Environment Setup
* **Description:** Installed required tools (Node.js LTS, npm, Git) and initialized the project folder with a Git repository.
* **File:** `keskkond.txt` (contains command outputs, name, and date).

### Task 2: Responsibility Distribution
* **Description:** Analyzed 12 parts of the badminton club application to determine whether they belong to the client, server, or both. Identified three things that must never reach the client and three attacks that succeed if validation is performed solely on the client side.
* **File:** `vastutus.md`

### Task 3: Dissected URLs
* **Description:** Broke down three URLs into their components (scheme, host, port, path, query string, fragment). Analyzed which parts reach the server, proving that fragments remain exclusively in the browser.
* **File:** `urlid.md`

### Task 4: Network Tracking with DevTools
* **Description:** Loaded `ut.ee`, monitored network requests, transfer sizes, and status codes (200, 304) using browser DevTools, and verified requests from the command line using `cURL`.
* **File:** `leiud.md` (contains findings and three conclusions).

### Task 5: Club Homepage and Search Form
* **Description:** Built a semantic HTML5 homepage for the badminton club with embedded CSS, including a schedule table and a search form (tested with GET and POST methods, proper field types, labels, and name attributes). Form behavior was tested and documented.
* **Files:** `index.html`, `vastus.txt`
