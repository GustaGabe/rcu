import { parseISO, subDays } from 'date-fns';

import type { Db } from '@/db/types';
import { toDateKey } from '@/domain/dates';
import { isScheduleCurrent, sameSchedule } from '@/domain/schedule';
import type {
  ISODate,
  Medication,
  MedicationDraft,
  MedicationForm,
  MedicationSchedule,
  MedicationStatus,
  ScheduleDraft,
  ScheduleFrequency,
} from '@/domain/types';

interface MedicationRow {
  id: number;
  condition_id: string | null;
  name: string;
  dose: string;
  form: MedicationForm;
  notes: string | null;
  status: MedicationStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

interface ScheduleRow {
  id: number;
  medication_id: number;
  frequency: ScheduleFrequency;
  interval_days: number | null;
  time_of_day: string;
  notification_id: string | null;
  starts_on: string | null;
  ends_on: string | null;
}

function toMedication(row: MedicationRow): Medication {
  return {
    id: row.id,
    conditionId: row.condition_id,
    name: row.name,
    dose: row.dose,
    form: row.form,
    notes: row.notes,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
  };
}

function toSchedule(row: ScheduleRow): MedicationSchedule {
  return {
    id: row.id,
    medicationId: row.medication_id,
    frequency: row.frequency,
    intervalDays: row.interval_days,
    timeOfDay: row.time_of_day,
    notificationId: row.notification_id,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
  };
}

export async function listMedications(db: Db): Promise<Medication[]> {
  const rows = await db.getAllAsync<MedicationRow>('SELECT * FROM medications ORDER BY name COLLATE NOCASE');
  return rows.map(toMedication);
}

export async function getMedication(db: Db, id: number): Promise<Medication | null> {
  const row = await db.getFirstAsync<MedicationRow>('SELECT * FROM medications WHERE id = ?', [id]);
  return row ? toMedication(row) : null;
}

/** Horários de um remédio, ou de todos quando `medicationId` é omitido. */
export async function listSchedules(db: Db, medicationId?: number): Promise<MedicationSchedule[]> {
  const rows =
    medicationId === undefined
      ? await db.getAllAsync<ScheduleRow>('SELECT * FROM medication_schedules ORDER BY time_of_day')
      : await db.getAllAsync<ScheduleRow>(
          'SELECT * FROM medication_schedules WHERE medication_id = ? ORDER BY time_of_day',
          [medicationId],
        );
  return rows.map(toSchedule);
}

export interface NewMedication extends MedicationDraft {
  conditionId: string | null;
  status?: MedicationStatus;
}

/** Grava o remédio e seus horários numa transação. Devolve o id criado. */
export async function createMedication(db: Db, input: NewMedication): Promise<number> {
  let id = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO medications (condition_id, name, dose, form, notes, status, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.conditionId,
        input.name,
        input.dose,
        input.form,
        input.notes,
        input.status ?? 'active',
        input.startDate,
        input.endDate,
      ],
    );
    id = result.lastInsertRowId;
    for (const s of input.schedules) await insertSchedule(db, id, s, null);
  });
  return id;
}

/**
 * Atualiza o remédio preservando o histórico de doses:
 * horários iguais continuam; removidos com doses marcadas são encerrados ontem
 * (os sem marcação são apagados); novos valem a partir de hoje se o remédio já começou.
 */
export async function updateMedication(db: Db, id: number, draft: MedicationDraft, today: ISODate): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE medications SET name = ?, dose = ?, form = ?, notes = ?, start_date = ?, end_date = ? WHERE id = ?',
      [draft.name, draft.dose, draft.form, draft.notes, draft.startDate, draft.endDate, id],
    );

    const current = (await listSchedules(db, id)).filter((s) => isScheduleCurrent(s, today));
    const pending = [...draft.schedules];

    for (const schedule of current) {
      const match = pending.findIndex((d) => sameSchedule(d, schedule));
      if (match >= 0) {
        pending.splice(match, 1);
        continue;
      }
      const logged = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM dose_logs WHERE schedule_id = ?',
        [schedule.id],
      );
      if (logged && logged.total > 0) {
        await db.runAsync('UPDATE medication_schedules SET ends_on = ? WHERE id = ?', [
          toDateKey(subDays(parseISO(today), 1)),
          schedule.id,
        ]);
      } else {
        await db.runAsync('DELETE FROM medication_schedules WHERE id = ?', [schedule.id]);
      }
    }

    const startsOn = draft.startDate < today ? today : null;
    for (const s of pending) await insertSchedule(db, id, s, startsOn);
  });
}

export async function setMedicationStatus(db: Db, id: number, status: MedicationStatus): Promise<void> {
  await db.runAsync('UPDATE medications SET status = ? WHERE id = ?', [status, id]);
}

async function insertSchedule(db: Db, medicationId: number, s: ScheduleDraft, startsOn: ISODate | null) {
  await db.runAsync(
    `INSERT INTO medication_schedules (medication_id, frequency, interval_days, time_of_day, starts_on)
     VALUES (?, ?, ?, ?, ?)`,
    [medicationId, s.frequency, s.frequency === 'interval' ? s.intervalDays : null, s.timeOfDay, startsOn],
  );
}
