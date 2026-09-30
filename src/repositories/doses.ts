import { addDays, parseISO, subDays } from 'date-fns';

import type { Db } from '@/db/types';
import { adherenceRatio } from '@/domain/adherence';
import { toDateKey } from '@/domain/dates';
import { applyDoseLogs, dosesForDate } from '@/domain/schedule';
import type { DoseLog, DoseLogStatus, ISODate, ISODateTime, ScheduledDose } from '@/domain/types';

import { listMedications, listSchedules } from './medications';

interface DoseLogRow {
  id: number;
  schedule_id: number;
  scheduled_for: string;
  status: DoseLogStatus;
  taken_at: string | null;
}

function toDoseLog(row: DoseLogRow): DoseLog {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    scheduledFor: row.scheduled_for,
    status: row.status,
    takenAt: row.taken_at,
  };
}

/** Registros com `scheduled_for` entre as datas `from` e `to`, inclusive. */
export async function listDoseLogs(db: Db, from: ISODate, to: ISODate): Promise<DoseLog[]> {
  const end = toDateKey(addDays(parseISO(to), 1));
  const rows = await db.getAllAsync<DoseLogRow>(
    'SELECT * FROM dose_logs WHERE scheduled_for >= ? AND scheduled_for < ? ORDER BY scheduled_for',
    [from, end],
  );
  return rows.map(toDoseLog);
}

export interface DoseMark {
  scheduleId: number;
  scheduledFor: ISODateTime;
  status: DoseLogStatus;
  takenAt: ISODateTime | null;
}

/** Marca uma dose como tomada ou pulada. Marcar de novo substitui a marcação anterior. */
export async function logDose(db: Db, mark: DoseMark): Promise<void> {
  await db.runAsync(
    `INSERT INTO dose_logs (schedule_id, scheduled_for, status, taken_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (schedule_id, scheduled_for) DO UPDATE SET status = excluded.status, taken_at = excluded.taken_at`,
    [mark.scheduleId, mark.scheduledFor, mark.status, mark.status === 'taken' ? mark.takenAt : null],
  );
}

/** Desfaz a marcação: a dose volta a ficar pendente. */
export async function clearDoseLog(db: Db, scheduleId: number, scheduledFor: ISODateTime): Promise<void> {
  await db.runAsync('DELETE FROM dose_logs WHERE schedule_id = ? AND scheduled_for = ?', [scheduleId, scheduledFor]);
}

/** Doses do dia já cruzadas com o que foi marcado. */
export async function getDosesForDate(db: Db, date: ISODate): Promise<ScheduledDose[]> {
  const [medications, schedules, logs] = await Promise.all([
    listMedications(db),
    listSchedules(db),
    listDoseLogs(db, date, date),
  ]);
  return applyDoseLogs(dosesForDate(medications, schedules, date), logs);
}

export interface Adherence {
  last7: number | null;
  last30: number | null;
}

export async function getAdherence(db: Db, now: Date = new Date()): Promise<Adherence> {
  const [medications, schedules, logs] = await Promise.all([
    listMedications(db),
    listSchedules(db),
    listDoseLogs(db, toDateKey(subDays(now, 29)), toDateKey(now)),
  ]);
  return {
    last7: adherenceRatio(medications, schedules, logs, 7, now),
    last30: adherenceRatio(medications, schedules, logs, 30, now),
  };
}
