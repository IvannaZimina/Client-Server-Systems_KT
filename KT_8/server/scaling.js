
 // 1. Kuus olekut, mis ei tohi jääda ainult ühe serveri mällu.
export const IN_MEMORY_STATE = {
  session: {
    symptom: 'juhuslik väljalogimine',
    fix: 'Salvesta istung Redisesse, et kõik serveri eksemplarid näeksid sama istungit.',
  },
  cache: {
    symptom: 'vastus sõltub sellest, kuhu päring sattus',
    fix: 'Kasuta kõigi eksemplaride jaoks ühist Redis-vahemälu.',
  },
  websocket: {
    symptom: 'A ei näe B teateid',
    fix: 'Kasuta sõnumite levitamiseks ühist Pub/Sub lahendust.',
  },
  counter: {
    symptom: 'statistika on eksemplaride arvu võrra vale',
    fix: 'Hoia loendurit andmebaasis ja kasuta aatomilisi uuendusi.',
  },
  scheduled_job: {
    symptom: 'kaks kirja ühe ostu kohta',
    fix: 'Kasuta ühises andmebaasis ülesannete registreerimist ja lukustamist.',
  },
  uploaded_file: {
    symptom: '404 iga teise päringu peale',
    fix: 'Salvesta failid ühisesse objektihoidlasse.',
  },
};

// 2. Leia rakenduses olekud, mis asuvad ainult serveri mälus.
export function findProblems(application = {}) {
  return Object.entries(IN_MEMORY_STATE)
    .filter(([name]) => application[name] === 'in-memory')
    .map(([name, details]) => ({
      name,
      symptom: details.symptom,
      fix: details.fix,
    }));
}

// 3. Kolm ühist olekuhoidlat ja nende puudused.
export const STORES = {
  redis: {
    pros: 'Kõik serveri eksemplarid näevad samu andmeid; TTL on sisse ehitatud.',
    cons: 'Üks lisateenus, mis võib maas olla.',
  },
  database: {
    pros: 'Püsiv ühine andmehoidla ja tehingute tugi.',
    cons: 'Aeglasem; iga päringuga suureneb andmebaasi koormus.',
  },
  object_store: {
    pros: 'Kõik serveri eksemplarid näevad SAMA faili.',
    cons: 'Iga kirjutus saadab terve objekti; ei sobi väikesele muutuvale olekule.',
  },
};
