/** Data no formato `yyyy-MM-dd`, no horário local. */
export type ISODate = string;
/** Data e hora no formato `yyyy-MM-ddTHH:mm:ss`, no horário local. */
export type ISODateTime = string;

export type MedicationForm = 'tablet' | 'suppository' | 'enema' | 'injection' | 'infusion' | 'other';
export type MedicationStatus = 'active' | 'paused' | 'archived';

export interface Medication {
  id: number;
  conditionId: string | null;
  name: string;
  dose: string;
  form: MedicationForm;
  notes: string | null;
  status: MedicationStatus;
  startDate: ISODate;
  endDate: ISODate | null;
  createdAt: ISODateTime;
}

export type ScheduleFrequency = 'daily' | 'interval';

export interface MedicationSchedule {
  id: number;
  medicationId: number;
  frequency: ScheduleFrequency;
  /** Só para `interval` (ex.: 14 ou 56). */
  intervalDays: number | null;
  /** `HH:mm` */
  timeOfDay: string;
  notificationId: string | null;
}

export type DoseLogStatus = 'taken' | 'skipped';

export interface DoseLog {
  id: number;
  scheduleId: number;
  scheduledFor: ISODateTime;
  status: DoseLogStatus;
  takenAt: ISODateTime | null;
}

/** Dose calculada para um dia: ainda não gravada se `status` for `pending`. */
export interface ScheduledDose {
  scheduleId: number;
  medicationId: number;
  medicationName: string;
  dose: string;
  scheduledFor: ISODateTime;
  status: DoseLogStatus | 'pending';
  takenAt: ISODateTime | null;
}

/** Valores do diário, indexados pela `key` do campo na definição da doença. */
export type DiaryValues = Record<string, number | string | null>;

export interface DiaryEntry {
  id: number;
  conditionId: string;
  date: ISODate;
  values: DiaryValues;
  notes: string | null;
}

export interface Episode {
  id: number;
  conditionId: string;
  startDate: ISODate;
  /** `null` = episódio em andamento. */
  endDate: ISODate | null;
  notes: string | null;
}

export type AppointmentType = 'consultation' | 'exam' | 'infusion';

export interface Appointment {
  id: number;
  conditionId: string | null;
  datetime: ISODateTime;
  type: AppointmentType;
  professional: string | null;
  location: string | null;
  notes: string | null;
  remind1d: boolean;
  remind2h: boolean;
}

export interface DoctorQuestion {
  id: number;
  /** `null` = ainda sem consulta. */
  appointmentId: number | null;
  question: string;
  answer: string | null;
  asked: boolean;
}
