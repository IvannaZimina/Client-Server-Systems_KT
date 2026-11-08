
/**
 * C09 Ex1 — Andmeskeem ja migratsioonid
 *
 * Skeemi loomine toimub kahe versioonitud migratsiooniga.
 * Rakendatud migratsioonid salvestatakse tabelisse schema_version.
 */

export const MIGRATIONS = [
  {
    // 2: migratsioon 1 — kuus põhiskeemi tabelit.
    v: 1,
    name: 'piletikassa põhiskeem',
    sql: [
      // 2: kasutajad ja unikaalne e-posti aadress.
      `CREATE TABLE IF NOT EXISTS \`user\` (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(120) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_user_email (email)
      ) ENGINE=InnoDB`,

      // 2: toimumiskohad.
      `CREATE TABLE IF NOT EXISTS venue (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(150) NOT NULL,
        address VARCHAR(255) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_venue_name (name)
      ) ENGINE=InnoDB`,

      // 2: sündmused, välisvõtmed ja CHECK-piirangud.
      `CREATE TABLE IF NOT EXISTS event (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        venue_id INT UNSIGNED NOT NULL,
        organizer_id INT UNSIGNED NOT NULL,
        name VARCHAR(200) NOT NULL,
        starts_at DATETIME NOT NULL,
        seat_count INT UNSIGNED NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_event_name_start (name, starts_at),
        KEY idx_event_venue (venue_id),
        KEY idx_event_organizer (organizer_id),
        KEY ix_event_starts_at (starts_at),
        CONSTRAINT fk_event_venue
          FOREIGN KEY (venue_id) REFERENCES venue(id)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_event_organizer
          FOREIGN KEY (organizer_id) REFERENCES \`user\`(id)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT chk_event_seat_count CHECK (seat_count > 0),
        CONSTRAINT chk_event_price CHECK (price >= 0)
      ) ENGINE=InnoDB`,

      // 2: sündmuse istekohad ja kordumatu asukoht.
      // Sündmuse kustutamisel kustutatakse ka selle kohad.
      `CREATE TABLE IF NOT EXISTS seat (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        event_id INT UNSIGNED NOT NULL,
        row_no INT UNSIGNED NOT NULL,
        seat_no INT UNSIGNED NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_seat_position (event_id, row_no, seat_no),
        KEY idx_seat_event (event_id),
        CONSTRAINT fk_seat_event
          FOREIGN KEY (event_id) REFERENCES event(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB`,

      // 2: tellimused ja seos ostjaga.
      // Tellimusega kasutajat ei saa kustutada.
      `CREATE TABLE IF NOT EXISTS orders (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id INT UNSIGNED NOT NULL,
        state VARCHAR(30) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_orders_user (user_id),
        CONSTRAINT fk_orders_user
          FOREIGN KEY (user_id) REFERENCES \`user\`(id)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB`,

      // 2: piletid ja müüdud koha unikaalsus.
      // uq_ticket_seat takistab sama koha korduvat müümist.
      `CREATE TABLE IF NOT EXISTS ticket (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        order_id INT UNSIGNED NOT NULL,
        seat_id INT UNSIGNED NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_ticket_seat (seat_id),
        KEY idx_ticket_order (order_id),
        CONSTRAINT fk_ticket_order
          FOREIGN KEY (order_id) REFERENCES orders(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_ticket_seat
          FOREIGN KEY (seat_id) REFERENCES seat(id)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB`,
    ],
  },
  {
    // 2: migratsioon 2 — kohtade ajutine hoidmine.
    v: 2,
    name: 'kohtade ajutine hoidmine',
    sql: [
      // Hoidmine seotakse koha ja ostjaga ning sellele määratakse tähtaeg.
      `CREATE TABLE IF NOT EXISTS hold (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        seat_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_hold_seat (seat_id),
        KEY idx_hold_user (user_id),
        KEY idx_hold_expires (expires_at),
        CONSTRAINT fk_hold_seat
          FOREIGN KEY (seat_id) REFERENCES seat(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_hold_user
          FOREIGN KEY (user_id) REFERENCES \`user\`(id)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB`,
    ],
  },
];

// 4: migratsioonide korduv käivitamine.
// Rakendatud versioone ei käivitata uuesti.
export async function migrate(conn) {
  // Migratsioonide ajalugu hoitakse andmebaasis.
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_version (
      v INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (v)
    ) ENGINE=InnoDB
  `);

  // Salvestatakse algne skeemi versioon.
  const [[current]] = await conn.query(
    'SELECT COALESCE(MAX(v), 0) AS version FROM schema_version'
  );

  const before = Number(current.version);
  const ran = [];

  // Käivitatakse ainult veel rakendamata migratsioonid versioonide järjekorras.
  for (const migration of [...MIGRATIONS].sort((a, b) => a.v - b.v)) {
    const [[existing]] = await conn.execute(
      'SELECT v FROM schema_version WHERE v = ?',
      [migration.v]
    );

    if (existing) continue;

    for (const statement of migration.sql) {
      await conn.query(statement);
    }

    // Pärast migratsiooni salvestatakse selle versioon ja nimi.
    await conn.execute(
      'INSERT INTO schema_version (v, name) VALUES (?, ?)',
      [migration.v, migration.name]
    );

    ran.push(migration.v);
  }

  // Tagastatakse algne versioon, lõplik versioon ja käivitatud migratsioonid.
  const [[latest]] = await conn.query(
    'SELECT COALESCE(MAX(v), 0) AS version FROM schema_version'
  );

  return {
    ran,
    before,
    after: Number(latest.version),
  };
}

// 6: algandmete lisamine ja korduv käivitamine.
// Olemasolevaid kirjeid ei dubleerita ning puuduvad kohad taastatakse.
export async function seed(conn) {
  // Lisatakse korraldaja või leitakse olemasolev kasutaja.
  await conn.execute(
    `INSERT INTO \`user\` (email, name, password_hash)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    ['organizer@piletikassa.ee', 'Piletikassa korraldaja', 'test-password-hash']
  );

  const [[organizer]] = await conn.execute(
    'SELECT id FROM `user` WHERE email = ?',
    ['organizer@piletikassa.ee']
  );

  // Lisatakse toimumiskoht või leitakse olemasolev.
  await conn.execute(
    `INSERT INTO venue (name, address)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    ['Piletikassa proovisaal', 'Tallinn']
  );

  const [[venue]] = await conn.execute(
    'SELECT id FROM venue WHERE name = ?',
    ['Piletikassa proovisaal']
  );

  // Lisatakse sündmus või kasutatakse olemasolevat sündmust.
  await conn.execute(
    `INSERT INTO event
       (venue_id, organizer_id, name, starts_at, seat_count, price)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [
      venue.id,
      organizer.id,
      'Piletikassa proovisündmus',
      '2026-12-01 19:00:00',
      12,
      '15.00',
    ]
  );

  const [[event]] = await conn.execute(
    'SELECT id FROM event WHERE name = ? AND starts_at = ?',
    ['Piletikassa proovisündmus', '2026-12-01 19:00:00']
  );

  // Lisatakse 12 kohta: kolm rida ja neli kohta igas reas.
  // UNIQUE-piirang väldib duplikaate ja võimaldab puuduvaid kohti taastada.
  for (let row = 1; row <= 3; row += 1) {
    for (let seat = 1; seat <= 4; seat += 1) {
      await conn.execute(
        `INSERT INTO seat (event_id, row_no, seat_no)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [event.id, row, seat]
      );
    }
  }
}
