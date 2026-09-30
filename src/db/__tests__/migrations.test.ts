import { createMigratedDb, createTestDb } from '@/testing/testDb';

import { LATEST_VERSION, migrate } from '../migrations';

describe('migrate', () => {
  it('cria todas as tabelas e marca a versão', async () => {
    const db = await createMigratedDb();
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    expect(tables.map((t) => t.name)).toEqual([
      'appointments',
      'diary_entries',
      'doctor_questions',
      'dose_logs',
      'episodes',
      'medication_schedules',
      'medications',
      'user_conditions',
    ]);
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(version?.user_version).toBe(LATEST_VERSION);
    db.close();
  });

  it('começa acompanhando a RCU', async () => {
    const db = await createMigratedDb();
    const rows = await db.getAllAsync<{ condition_id: string }>('SELECT condition_id FROM user_conditions');
    expect(rows).toEqual([{ condition_id: 'rcu' }]);
    db.close();
  });

  it('é idempotente', async () => {
    const db = createTestDb();
    await migrate(db);
    await migrate(db);
    const rows = await db.getAllAsync('SELECT * FROM user_conditions');
    expect(rows).toHaveLength(1);
    db.close();
  });

  it('recusa valores fora do domínio', async () => {
    const db = await createMigratedDb();
    await expect(
      db.runAsync("INSERT INTO medications (name, dose, form, start_date) VALUES ('X', '1', 'pill', '2026-01-01')"),
    ).rejects.toThrow();
    db.close();
  });
});
