import type { Db } from '@/db/types';
import type { Appointment, AppointmentType, DoctorQuestion, ISODateTime } from '@/domain/types';

interface AppointmentRow {
  id: number;
  condition_id: string | null;
  datetime: string;
  type: AppointmentType;
  professional: string | null;
  location: string | null;
  notes: string | null;
  remind_1d: number;
  remind_2h: number;
}

interface QuestionRow {
  id: number;
  appointment_id: number | null;
  question: string;
  answer: string | null;
  asked: number;
}

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    conditionId: row.condition_id,
    datetime: row.datetime,
    type: row.type,
    professional: row.professional,
    location: row.location,
    notes: row.notes,
    remind1d: row.remind_1d === 1,
    remind2h: row.remind_2h === 1,
  };
}

function toQuestion(row: QuestionRow): DoctorQuestion {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    question: row.question,
    answer: row.answer,
    asked: row.asked === 1,
  };
}

/** Todas as consultas em ordem cronológica. */
export async function listAppointments(db: Db): Promise<Appointment[]> {
  const rows = await db.getAllAsync<AppointmentRow>('SELECT * FROM appointments ORDER BY datetime');
  return rows.map(toAppointment);
}

export async function getAppointment(db: Db, id: number): Promise<Appointment | null> {
  const row = await db.getFirstAsync<AppointmentRow>('SELECT * FROM appointments WHERE id = ?', [id]);
  return row ? toAppointment(row) : null;
}

/** Primeira consulta a partir de `from`. */
export async function getNextAppointment(db: Db, from: ISODateTime): Promise<Appointment | null> {
  const row = await db.getFirstAsync<AppointmentRow>(
    'SELECT * FROM appointments WHERE datetime >= ? ORDER BY datetime LIMIT 1',
    [from],
  );
  return row ? toAppointment(row) : null;
}

export interface AppointmentInput {
  conditionId: string | null;
  datetime: ISODateTime;
  type: AppointmentType;
  professional: string | null;
  location: string | null;
  notes: string | null;
  remind1d: boolean;
  remind2h: boolean;
}

export async function createAppointment(db: Db, input: AppointmentInput): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO appointments (condition_id, datetime, type, professional, location, notes, remind_1d, remind_2h)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.conditionId,
      input.datetime,
      input.type,
      input.professional,
      input.location,
      input.notes,
      input.remind1d ? 1 : 0,
      input.remind2h ? 1 : 0,
    ],
  );
  return result.lastInsertRowId;
}

/** Perguntas de uma consulta; `null` lista as que ainda não têm consulta. */
export async function listQuestions(db: Db, appointmentId: number | null): Promise<DoctorQuestion[]> {
  const rows =
    appointmentId === null
      ? await db.getAllAsync<QuestionRow>('SELECT * FROM doctor_questions WHERE appointment_id IS NULL ORDER BY id')
      : await db.getAllAsync<QuestionRow>('SELECT * FROM doctor_questions WHERE appointment_id = ? ORDER BY id', [
          appointmentId,
        ]);
  return rows.map(toQuestion);
}

/** Quantas perguntas ainda não feitas cada consulta tem, por id da consulta. */
export async function countOpenQuestions(db: Db): Promise<Record<number, number>> {
  const rows = await db.getAllAsync<{ appointment_id: number; total: number }>(
    `SELECT appointment_id, COUNT(*) AS total FROM doctor_questions
     WHERE asked = 0 AND appointment_id IS NOT NULL GROUP BY appointment_id`,
  );
  return Object.fromEntries(rows.map((r) => [r.appointment_id, r.total]));
}

export interface QuestionInput {
  appointmentId: number | null;
  question: string;
  answer: string | null;
  asked: boolean;
}

export async function createQuestion(db: Db, input: QuestionInput): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO doctor_questions (appointment_id, question, answer, asked) VALUES (?, ?, ?, ?)',
    [input.appointmentId, input.question, input.answer, input.asked ? 1 : 0],
  );
  return result.lastInsertRowId;
}

export async function setQuestionAsked(db: Db, id: number, asked: boolean): Promise<void> {
  await db.runAsync('UPDATE doctor_questions SET asked = ? WHERE id = ?', [asked ? 1 : 0, id]);
}
