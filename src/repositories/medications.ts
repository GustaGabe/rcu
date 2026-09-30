import type { Db } from '@/db/types';
import type {
  ISODate,
  Medication,
  MedicationForm,
  MedicationSchedule,
  MedicationStatus,
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

export interface NewSchedule {
  frequency: ScheduleFrequency;
  intervalDays: number | null;
  timeOfDay: string;
}

export interface NewMedication {
  conditionId: string | null;
  name: string;
  dose: string;
  form: MedicationForm;
  notes: string | null;
  status?: MedicationStatus;
  startDate: ISODate;
  endDate: ISODate | null;
  schedules: NewSchedule[];
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
    for (const s of input.schedules) {
      await db.runAsync(
        'INSERT INTO medication_schedules (medication_id, frequency, interval_days, time_of_day) VALUES (?, ?, ?, ?)',
        [id, s.frequency, s.frequency === 'interval' ? s.intervalDays : null, s.timeOfDay],
      );
    }
  });
  return id;
}
