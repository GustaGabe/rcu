// Dados falsos da etapa 2. Serão substituídos pelos repositórios do SQLite na etapa 3.
import { addDays } from 'date-fns';

import { toDateKey } from '@/domain/dates';
import type {
  Appointment,
  DiaryEntry,
  DoctorQuestion,
  Episode,
  ISODate,
  ISODateTime,
  Medication,
  MedicationSchedule,
  ScheduledDose,
} from '@/domain/types';

const now = new Date();
const day = (offset: number): ISODate => toDateKey(addDays(now, offset));
const at = (offset: number, time: string): ISODateTime => `${day(offset)}T${time}:00`;

export const medications: Medication[] = [
  {
    id: 1,
    conditionId: 'rcu',
    name: 'Mesalazina',
    dose: '2 comprimidos de 800 mg',
    form: 'tablet',
    notes: 'Tomar após as refeições',
    status: 'active',
    startDate: day(-200),
    endDate: null,
    createdAt: at(-200, '10:00'),
  },
  {
    id: 2,
    conditionId: 'rcu',
    name: 'Mesalazina supositório',
    dose: '1 supositório de 1 g',
    form: 'suppository',
    notes: null,
    status: 'active',
    startDate: day(-30),
    endDate: day(30),
    createdAt: at(-30, '10:00'),
  },
  {
    id: 3,
    conditionId: 'rcu',
    name: 'Infliximabe',
    dose: '5 mg/kg',
    form: 'infusion',
    notes: 'No centro de infusão',
    status: 'active',
    startDate: day(-120),
    endDate: null,
    createdAt: at(-120, '10:00'),
  },
  {
    id: 4,
    conditionId: 'rcu',
    name: 'Prednisona',
    dose: '20 mg',
    form: 'tablet',
    notes: 'Desmame pausado pelo médico',
    status: 'paused',
    startDate: day(-60),
    endDate: null,
    createdAt: at(-60, '10:00'),
  },
  {
    id: 5,
    conditionId: null,
    name: 'Omeprazol',
    dose: '1 cápsula de 20 mg',
    form: 'other',
    notes: null,
    status: 'archived',
    startDate: day(-300),
    endDate: day(-100),
    createdAt: at(-300, '10:00'),
  },
];

export const schedules: MedicationSchedule[] = [
  { id: 1, medicationId: 1, frequency: 'daily', intervalDays: null, timeOfDay: '08:00', notificationId: null },
  { id: 2, medicationId: 1, frequency: 'daily', intervalDays: null, timeOfDay: '20:00', notificationId: null },
  { id: 3, medicationId: 2, frequency: 'daily', intervalDays: null, timeOfDay: '22:00', notificationId: null },
  { id: 4, medicationId: 3, frequency: 'interval', intervalDays: 56, timeOfDay: '09:00', notificationId: null },
  { id: 5, medicationId: 4, frequency: 'daily', intervalDays: null, timeOfDay: '07:00', notificationId: null },
  { id: 6, medicationId: 5, frequency: 'daily', intervalDays: null, timeOfDay: '07:00', notificationId: null },
];

/** Na etapa 4 isto vem de `dosesForDate(schedules, date)` cruzado com `dose_logs`. */
export const todayDoses: ScheduledDose[] = [
  {
    scheduleId: 1,
    medicationId: 1,
    medicationName: 'Mesalazina',
    dose: '2 comprimidos de 800 mg',
    scheduledFor: at(0, '08:00'),
    status: 'taken',
    takenAt: at(0, '08:12'),
  },
  {
    scheduleId: 2,
    medicationId: 1,
    medicationName: 'Mesalazina',
    dose: '2 comprimidos de 800 mg',
    scheduledFor: at(0, '20:00'),
    status: 'pending',
    takenAt: null,
  },
  {
    scheduleId: 3,
    medicationId: 2,
    medicationName: 'Mesalazina supositório',
    dose: '1 supositório de 1 g',
    scheduledFor: at(0, '22:00'),
    status: 'pending',
    takenAt: null,
  },
];

export const adherence = { last7: 0.93, last30: 0.88 };

export const diaryEntries: DiaryEntry[] = [
  { id: 6, conditionId: 'rcu', date: day(-1), values: { bowel_count: 3, blood: 'none', urgency: 1, pain: 2, bristol: 4, fatigue: 1 }, notes: null },
  { id: 5, conditionId: 'rcu', date: day(-2), values: { bowel_count: 5, blood: 'little', urgency: 2, pain: 4, bristol: 5, fatigue: 2 }, notes: 'Melhorando' },
  { id: 4, conditionId: 'rcu', date: day(-3), values: { bowel_count: 7, blood: 'little', urgency: 3, pain: 6, bristol: 6, fatigue: 3 }, notes: null },
  { id: 3, conditionId: 'rcu', date: day(-4), values: { bowel_count: 8, blood: 'lots', urgency: 3, pain: 7, bristol: 6, fatigue: 3 }, notes: 'Começou a crise' },
  { id: 2, conditionId: 'rcu', date: day(-5), values: { bowel_count: 4, blood: 'none', urgency: 1, pain: 3, bristol: 5, fatigue: 1 }, notes: null },
  { id: 1, conditionId: 'rcu', date: day(-6), values: { bowel_count: 2, blood: 'none', urgency: 0, pain: 1, bristol: 4, fatigue: 0 }, notes: null },
];

export const episodes: Episode[] = [
  { id: 1, conditionId: 'rcu', startDate: day(-4), endDate: day(-2), notes: null },
];

export const appointments: Appointment[] = [
  {
    id: 1,
    conditionId: 'rcu',
    datetime: at(5, '14:30'),
    type: 'consultation',
    professional: 'Gastroenterologista',
    location: 'Clínica do bairro, sala 12',
    notes: 'Levar os últimos exames',
    remind1d: true,
    remind2h: true,
  },
  {
    id: 2,
    conditionId: 'rcu',
    datetime: at(12, '07:30'),
    type: 'exam',
    professional: 'Laboratório',
    location: 'Laboratório central',
    notes: 'Calprotectina fecal',
    remind1d: true,
    remind2h: false,
  },
  {
    id: 3,
    conditionId: 'rcu',
    datetime: at(-20, '09:00'),
    type: 'infusion',
    professional: 'Enfermagem',
    location: 'Centro de infusão',
    notes: null,
    remind1d: true,
    remind2h: true,
  },
];

export const doctorQuestions: DoctorQuestion[] = [
  { id: 1, appointmentId: 1, question: 'Posso diminuir a prednisona de novo?', answer: null, asked: false },
  { id: 2, appointmentId: 1, question: 'A crise da semana passada muda o tratamento?', answer: null, asked: false },
  { id: 3, appointmentId: 3, question: 'Quando é a próxima infusão?', answer: 'Daqui a 8 semanas.', asked: true },
];
