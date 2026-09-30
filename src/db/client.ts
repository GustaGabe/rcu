import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useMemo } from 'react';

import { migrate } from './migrations';
import type { Db } from './types';

export const DATABASE_NAME = 'rcu.db';

/** Adapta o `SQLiteDatabase` do expo-sqlite à interface `Db` dos repositórios. */
function toDb(sqlite: SQLiteDatabase): Db {
  return {
    execAsync: (sql) => sqlite.execAsync(sql),
    runAsync: (sql, params = []) => sqlite.runAsync(sql, params),
    getFirstAsync: (sql, params = []) => sqlite.getFirstAsync(sql, params),
    getAllAsync: (sql, params = []) => sqlite.getAllAsync(sql, params),
    withTransactionAsync: (task) => sqlite.withTransactionAsync(task),
  };
}

/** Roda uma vez ao abrir o app, antes de qualquer tela (`onInit` do `SQLiteProvider`). */
export async function initDatabase(sqlite: SQLiteDatabase): Promise<void> {
  await sqlite.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrate(toDb(sqlite));
}

/** Banco aberto pelo `SQLiteProvider` do layout raiz. Telas só o repassam aos repositórios. */
export function useDb(): Db {
  const sqlite = useSQLiteContext();
  return useMemo(() => toDb(sqlite), [sqlite]);
}
