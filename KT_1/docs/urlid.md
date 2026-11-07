# Ülesanne 3 - URL lahti võetud

## 1. https://klubi.example.ee:8443/mangukorrad/12?sort=kuupaev&vabu=2#tulemused

| Osa           | Vaartus             | Mida utleb                                                                                              |
| ------------- | ------------------- | ------------------------------------------------------------------------------------------------------- |
| Skeem         | https               | Kasutatakse turvalist HTTPS protokolli.                                                                 |
| Host          | klubi.example.ee    | Serveri domeeninimi.                                                                                    |
| Port          | 8443                | Serveri port, mida ühenduseks kasutatakse (vaikimisi https jaoks on 443, aga siin on spetsiaalne port). |
| Tee           | /mangukorrad/12     | Konkreetse ressursi tee (mängukord ID-ga 12).                                                           |
| Päringustring | sort=kuupaev&vabu=2 | Lisaparameetrid: sorteerimine kuupäeva järgi ja vabu kohti vähemalt 2.                                  |
| Fragment      | tulemused           | Lehe sisene ankur (#tulemused), mida server ei näe.                                                     |

## 2. http://localhost:3000/api/mangijad

| Osa           | Vaartus       | Mida utleb                                                  |
| ------------- | ------------- | ----------------------------------------------------------- |
| Skeem         | http          | Kasutatakse tavalist HTTP protokolli (krüpteerimata).       |
| Host          | localhost     | Viitab kohalikule arvutile (testimiseks).                   |
| Port          | 3000          | Rakenduse port (tavaline Node.js/Express dev-serveri port). |
| Tee           | /api/mangijad | API-otspunkt mängijate nimekirja pärimiseks.                |
| Päringustring | -             | Puudub.                                                     |
| Fragment      | -             | Puudub.                                                     |

## 3. https://www.ut.ee/et/oppimine?utm_source=uudiskiri

| Osa           | Vaartus              | Mida utleb                                                                                |
| ------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| Skeem         | https                | Turvaline HTTPS protokoll.                                                                |
| Host          | www.ut.ee            | Tartu Ülikooli veebiserveri domeen.                                                       |
| Port          | 443 (vaikimisi)      | Pordikomponent on URL-is puudu, aga kuna skeem on https, kasutatakse vaikimisi porti 443. |
| Tee           | /et/oppimine         | Lehekülje tee (õppimise ala eesti keeles).                                                |
| Päringustring | utm_source=uudiskiri | Turunduslik metainfo / UTM-parameeter, mis näitab liikluse päritolu.                      |
| Fragment      | -                    | Puudub.                                                                                   |

## Millised osad jõuavad serverini

| Osa           | Jouab serverini | Selgitus                                                                            |
| ------------- | --------------- | ----------------------------------------------------------------------------------- |
| Skeem         | Jah             | Server peab teadma, kas ühendus on turvaline (http/https).                          |
| Host          | Jah             | Vajalik, et server teaks, millisele domeenile/aadressile päring on suunatud.        |
| Port          | Jah             | Võrgupakett sisaldab alati sihtporti, kuhu serveri rakendus kuulama on häälestatud. |
| Tee           | Jah             | Server analüüsib teed (routing), et otsustada, millist funktsiooni täita.           |
| Päringustring | Jah             | Server loeb parameetreid (nt filtrid, otsingud, ID-d), et andmeid töödelda.         |
| Fragment      | **Ei**          | Brauser töötleb räsi (#) kohapeal ega saada seda kunagi serverile.                  |