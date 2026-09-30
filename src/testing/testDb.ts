// Só para testes (usa better-sqlite3, dependência de desenvolvimento). Nunca importe no app.
import Database from 'better-sqlite3';

import { migrate } from '@/db/migrations';
import type { Db, SqlValue } from '@/db/types';

/** `Db` sobre um SQLite em memória (better-sqlite3), para testar SQL de verdade no Jest. */
export function createTestDb(): Db & { close(): void } {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');

  return {
    async execAsync(sql: string) {
      sqlite.exec(sql);
    },
    async runAsync(sql: string, params: SqlValue[] = []) {
      const result = sqlite.prepare(sql).run(...params);
      return { lastInsertRowId: Number(result.lastInsertRowid), changes: result.changes };
    },
    async getFirstAsync<T>(sql: string, params: SqlValue[] = []) {
      return (sqlite.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async getAllAsync<T>(sql: string, params: SqlValue[] = []) {
      return sqlite.prepare(sql).all(...params) as T[];
    },
    async withTransactionAsync(task: () => Promise<void>) {
      sqlite.exec('BEGIN');
      try {
        await task();
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
    close() {
      sqlite.close();
    },
  };
}

/** Banco em memória já migrado. */
export async function createMigratedDb() {
  const db = createTestDb();
  await migrate(db);
  return db;
}
