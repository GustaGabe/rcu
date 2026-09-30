import type { Db } from '@/db/types';

/** Chaves conhecidas de `app_settings`. */
export type SettingKey = 'onboarding_completed_at';

export async function getSetting(db: Db, key: SettingKey): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setSetting(db: Db, key: SettingKey, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

export async function deleteSetting(db: Db, key: SettingKey): Promise<void> {
  await db.runAsync('DELETE FROM app_settings WHERE key = ?', [key]);
}
