import type { Db } from './types';

const NOW_LOCAL = "(strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime'))";

/**
 * Cada item leva o banco da versão `i` para `i + 1` (guardada em `PRAGMA user_version`).
 * Nunca edite uma migração publicada: acrescente uma nova no fim.
 */
const migrations: string[] = [
  // 1: modelo inicial, já com várias doenças
  `
  CREATE TABLE user_conditions (
    condition_id TEXT PRIMARY KEY,
    active       INTEGER NOT NULL DEFAULT 1,
    added_at     TEXT NOT NULL DEFAULT ${NOW_LOCAL}
  );
  INSERT INTO user_conditions (condition_id) VALUES ('rcu');

  CREATE TABLE medications (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    condition_id TEXT,
    name         TEXT NOT NULL,
    dose         TEXT NOT NULL,
    form         TEXT NOT NULL CHECK (form IN ('tablet', 'suppository', 'enema', 'injection', 'infusion', 'other')),
    notes        TEXT,
    status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    start_date   TEXT NOT NULL,
    end_date     TEXT,
    created_at   TEXT NOT NULL DEFAULT ${NOW_LOCAL}
  );

  CREATE TABLE medication_schedules (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    medication_id   INTEGER NOT NULL REFERENCES medications(id),
    frequency       TEXT NOT NULL CHECK (frequency IN ('daily', 'interval')),
    interval_days   INTEGER CHECK (frequency = 'daily' OR interval_days > 0),
    time_of_day     TEXT NOT NULL,
    notification_id TEXT
  );
  CREATE INDEX idx_schedules_medication ON medication_schedules (medication_id);

  CREATE TABLE dose_logs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id   INTEGER NOT NULL REFERENCES medication_schedules(id),
    scheduled_for TEXT NOT NULL,
    status        TEXT NOT NULL CHECK (status IN ('taken', 'skipped')),
    taken_at      TEXT,
    UNIQUE (schedule_id, scheduled_for)
  );
  CREATE INDEX idx_dose_logs_scheduled_for ON dose_logs (scheduled_for);

  CREATE TABLE diary_entries (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    condition_id TEXT NOT NULL,
    date         TEXT NOT NULL,
    values_json  TEXT NOT NULL,
    notes        TEXT,
    UNIQUE (condition_id, date)
  );

  CREATE TABLE episodes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    condition_id TEXT NOT NULL,
    start_date   TEXT NOT NULL,
    end_date     TEXT,
    notes        TEXT
  );

  CREATE TABLE appointments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    condition_id TEXT,
    datetime     TEXT NOT NULL,
    type         TEXT NOT NULL CHECK (type IN ('consultation', 'exam', 'infusion')),
    professional TEXT,
    location     TEXT,
    notes        TEXT,
    remind_1d    INTEGER NOT NULL DEFAULT 1,
    remind_2h    INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX idx_appointments_datetime ON appointments (datetime);

  CREATE TABLE doctor_questions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    question       TEXT NOT NULL,
    answer         TEXT,
    asked          INTEGER NOT NULL DEFAULT 0
  );
  `,
];

export const LATEST_VERSION = migrations.length;

/** Aplica as migrações pendentes, cada uma em sua transação. */
export async function migrate(db: Db): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current; version < migrations.length; version++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migrations[version]);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
