import type { Db } from '@/db/types';
import type { DiaryEntry, DiaryValues, Episode, ISODate } from '@/domain/types';

interface DiaryRow {
  id: number;
  condition_id: string;
  date: string;
  values_json: string;
  notes: string | null;
}

interface EpisodeRow {
  id: number;
  condition_id: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
}

function toEntry(row: DiaryRow): DiaryEntry {
  return {
    id: row.id,
    conditionId: row.condition_id,
    date: row.date,
    values: JSON.parse(row.values_json) as DiaryValues,
    notes: row.notes,
  };
}

function toEpisode(row: EpisodeRow): Episode {
  return {
    id: row.id,
    conditionId: row.condition_id,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
  };
}

/** Registros do mais recente para o mais antigo. */
export async function listDiaryEntries(db: Db, conditionId: string, limit = 90): Promise<DiaryEntry[]> {
  const rows = await db.getAllAsync<DiaryRow>(
    'SELECT * FROM diary_entries WHERE condition_id = ? ORDER BY date DESC LIMIT ?',
    [conditionId, limit],
  );
  return rows.map(toEntry);
}

export async function getDiaryEntry(db: Db, conditionId: string, date: ISODate): Promise<DiaryEntry | null> {
  const row = await db.getFirstAsync<DiaryRow>('SELECT * FROM diary_entries WHERE condition_id = ? AND date = ?', [
    conditionId,
    date,
  ]);
  return row ? toEntry(row) : null;
}

/** Último registro antes da data: fonte dos valores padrão do formulário do dia. */
export async function getPreviousDiaryEntry(db: Db, conditionId: string, date: ISODate): Promise<DiaryEntry | null> {
  const row = await db.getFirstAsync<DiaryRow>(
    'SELECT * FROM diary_entries WHERE condition_id = ? AND date < ? ORDER BY date DESC LIMIT 1',
    [conditionId, date],
  );
  return row ? toEntry(row) : null;
}

export interface DiaryInput {
  conditionId: string;
  date: ISODate;
  values: DiaryValues;
  notes: string | null;
}

/** Um registro por dia: salvar de novo no mesmo dia atualiza o existente. */
export async function saveDiaryEntry(db: Db, input: DiaryInput): Promise<void> {
  await db.runAsync(
    `INSERT INTO diary_entries (condition_id, date, values_json, notes) VALUES (?, ?, ?, ?)
     ON CONFLICT (condition_id, date) DO UPDATE SET values_json = excluded.values_json, notes = excluded.notes`,
    [input.conditionId, input.date, JSON.stringify(input.values), input.notes],
  );
}

/** Episódios (crises) do mais recente para o mais antigo. */
export async function listEpisodes(db: Db, conditionId: string): Promise<Episode[]> {
  const rows = await db.getAllAsync<EpisodeRow>(
    'SELECT * FROM episodes WHERE condition_id = ? ORDER BY start_date DESC',
    [conditionId],
  );
  return rows.map(toEpisode);
}

export interface EpisodeInput {
  conditionId: string;
  startDate: ISODate;
  endDate: ISODate | null;
  notes: string | null;
}

export async function createEpisode(db: Db, input: EpisodeInput): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO episodes (condition_id, start_date, end_date, notes) VALUES (?, ?, ?, ?)',
    [input.conditionId, input.startDate, input.endDate, input.notes],
  );
  return result.lastInsertRowId;
}
