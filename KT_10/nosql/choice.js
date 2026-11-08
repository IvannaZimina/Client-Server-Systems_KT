
// C10 Ex6 — SQL, MongoDB ja Firestore kõrvuti

export const INTERFACE = [
  'findAll',
  'readTotal',
  'findById',
  'add',
  'update',
  'remove',
];

export function backendFits(backend) {
  const missing = INTERFACE.filter(
    (method) => typeof backend?.[method] !== 'function',
  );

  return {
    fits: missing.length === 0,
    missing,
  };
}

// MongoDB väljade teisendamine rakenduse lepingu kujule.
function toPublic(document) {
  if (!document) return null;

  const {
    _id,
    startsAt,
    seatCount,
    ...rest
  } = document;

  return {
    ...rest,
    id: String(_id),
    starts_at: startsAt,
    seat_count: seatCount,
  };
}

// Rakenduse väljade teisendamine MongoDB dokumendi kujule.
function toMongo(data) {
  const {
    starts_at,
    seat_count,
    ...rest
  } = data;

  return {
    ...rest,
    ...(starts_at !== undefined ? { startsAt: starts_at } : {}),
    ...(seat_count !== undefined ? { seatCount: seat_count } : {}),
  };
}

export function mongoBackend(db) {
  const events = db.collection('events');

  return {
    async findAll({ per } = {}) {
      let cursor = events.find().sort({ startsAt: 1 });

      if (Number.isInteger(per) && per > 0) {
        cursor = cursor.limit(per);
      }

      const documents = await cursor.toArray();
      return documents.map(toPublic);
    },

    async readTotal() {
      return events.countDocuments();
    },

    async findById(id) {
      const document = await events.findOne({ _id: String(id) });
      return toPublic(document);
    },

    async add(data) {
      const { id, ...fields } = data;

      await events.insertOne({
        _id: String(id),
        ...toMongo(fields),
      });

      return toPublic(
        await events.findOne({ _id: String(id) }),
      );
    },

    async update(id, changes) {
      const document = await events.findOneAndUpdate(
        { _id: String(id) },
        { $set: toMongo(changes) },
        {
          returnDocument: 'after',
          includeResultMetadata: false,
        },
      );

      return toPublic(document);
    },

    async remove(id) {
      const result = await events.deleteOne({ _id: String(id) });
      return result.deletedCount === 1;
    },
  };
}

export const PORTABLE = {
  yes: [
    'CRUD-operatsioonid',
    'andmete lugemine ja kirjutamine',
    'ID kasutamine',
    'äriloogika teenusekihis',
    'andmete valideerimine rakenduses',
  ],
  no: [
    'JOIN-päringud',
    'reaalajakuulaja',
    'koondamiskonveier',
    'tehingu ulatus',
    'skeemipiirangud',
  ],
};

export const CRITERIA = [
  {
    question: 'Kas on vaja rangeid tehinguid?',
    sql: 'Toetab mitme rea tehinguid.',
    mongo: 'Toetab mitme dokumendi tehinguid Replica Set-režiimis.',
    firestore: 'Toetab tehinguid oma piirangutega.',
  },
  {
    question: 'Kas on vaja keerukaid aruandeid?',
    sql: 'JOIN ja koondfunktsioonid sobivad aruannete jaoks.',
    mongo: 'Aruandeid saab koostada koondamiskonveieriga.',
    firestore: 'EI OSKA keerukaid aruandeid otse SQL-i moodi teha.',
  },
  {
    question: 'Kas on vaja reaalajakuulajat?',
    sql: 'Vajab eraldi lahendust.',
    mongo: 'Võimalikud on Change Streams.',
    firestore: 'Reaalajakuulajad on sisseehitatud.',
  },
  {
    question: 'Kas andmestruktuur muutub sageli?',
    sql: 'Skeem on üldjuhul ette määratud.',
    mongo: 'Dokumentide struktuur on paindlik.',
    firestore: 'Dokumentide struktuur on paindlik.',
  },
  {
    question: 'Kas on vaja keerukaid päringuid?',
    sql: 'Toetab laia valikut päringuid ja JOIN-e.',
    mongo: 'Toetab päringuid ja koondamiskonveierit.',
    firestore: 'Päringute võimalused on piiratumad.',
  },
];

export function advise({
  strictConsistency,
  reports,
  realtime = false,
  shapeStable = true,
}) {
  if (strictConsistency && reports) {
    return 'SQL';
  }

  if (!strictConsistency && !reports && realtime) {
    return 'Firestore';
  }

  if (
    !strictConsistency &&
    reports &&
    !realtime &&
    !shapeStable
  ) {
    return 'MongoDB';
  }

  if (strictConsistency) {
    return 'SQL';
  }

  return 'MongoDB';
}

export function hybridOk({ sources, syncOneWay }) {
  const ok = sources === 1 && syncOneWay === true;

  return {
    ok,
    reason: ok
      ? 'Üks algallikas ja ühesuunaline sünkroon säilitavad ühe tõe.'
      : 'Mitu algallikat või kahesuunaline sünkroon võivad lahku minna.',
  };
}

export const MIGRATION_STEPS = [
  'Kaardista vana andmebaasi tabelid, andmed ja sõltuvused.',
  'Loo uus andmebaas ja kohanda andmete struktuur.',
  'Kopeeri andmed uude andmebaasi ning kontrolli tulemusi.',
  'lõpeta vanasse andmebaasi kirjutamine, kontrolli uut lahendust ja jäta vana andmebaas ALLES.',
  'kustuta vana andmebaas pärast uue lahenduse kontrollimist.',
];
