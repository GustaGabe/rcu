// Só para desenvolvimento: carrega um conjunto de exemplo ou apaga tudo.
// Acionado por um toque longo no painel da tela Hoje quando __DEV__ é verdadeiro.
import { addDays, subDays } from 'date-fns';

import { toDateKey, toDateTimeKey } from '@/domain/dates';
import { dosesForDate } from '@/domain/schedule';
import type { ISODate, ISODateTime } from '@/domain/types';
import { createAppointment, createQuestion } from '@/repositories/appointments';
import { createEpisode, saveDiaryEntry } from '@/repositories/diary';
import { logDose } from '@/repositories/doses';
import { createMedication, listMedications, listSchedules } from '@/repositories/medications';

import type { Db } from './types';

/** Apaga os registros do usuário. Mantém as doenças acompanhadas. */
export async function clearAllData(db: Db): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM dose_logs;
      DELETE FROM medication_schedules;
      DELETE FROM medications;
      DELETE FROM diary_entries;
      DELETE FROM episodes;
      DELETE FROM doctor_questions;
      DELETE FROM appointments;
      DELETE FROM sqlite_sequence;
    `);
  });
}

/** Troca o conteúdo do banco por um mês de exemplo, com datas relativas a `now`. */
export async function loadExampleData(db: Db, now: Date = new Date()): Promise<void> {
  await clearAllData(db);

  const day = (offset: number): ISODate => toDateKey(addDays(now, offset));
  const at = (offset: number, time: string): ISODateTime => `${day(offset)}T${time}:00`;

  await createMedication(db, {
    conditionId: 'rcu',
    name: 'Mesalazina',
    dose: '2 comprimidos de 800 mg',
    form: 'tablet',
    notes: 'Tomar após as refeições',
    startDate: day(-200),
    endDate: null,
    schedules: [
      { frequency: 'daily', intervalDays: null, timeOfDay: '08:00' },
      { frequency: 'daily', intervalDays: null, timeOfDay: '20:00' },
    ],
  });
  await createMedication(db, {
    conditionId: 'rcu',
    name: 'Mesalazina supositório',
    dose: '1 supositório de 1 g',
    form: 'suppository',
    notes: null,
    startDate: day(-30),
    endDate: day(30),
    schedules: [{ frequency: 'daily', intervalDays: null, timeOfDay: '22:00' }],
  });
  await createMedication(db, {
    conditionId: 'rcu',
    name: 'Infliximabe',
    dose: '5 mg/kg',
    form: 'infusion',
    notes: 'No centro de infusão',
    startDate: day(-112),
    endDate: null,
    schedules: [{ frequency: 'interval', intervalDays: 56, timeOfDay: '09:00' }],
  });
  await createMedication(db, {
    conditionId: 'rcu',
    name: 'Prednisona',
    dose: '20 mg',
    form: 'tablet',
    notes: 'Desmame pausado pelo médico',
    status: 'paused',
    startDate: day(-60),
    endDate: null,
    schedules: [{ frequency: 'daily', intervalDays: null, timeOfDay: '07:00' }],
  });
  await createMedication(db, {
    conditionId: null,
    name: 'Omeprazol',
    dose: '1 cápsula de 20 mg',
    form: 'other',
    notes: null,
    status: 'archived',
    startDate: day(-300),
    endDate: day(-100),
    schedules: [{ frequency: 'daily', intervalDays: null, timeOfDay: '07:00' }],
  });

  // Um mês de doses marcadas, com algumas esquecidas e puladas.
  const [medications, schedules] = await Promise.all([listMedications(db), listSchedules(db)]);
  const nowKey = toDateTimeKey(now);
  let n = 0;
  for (let offset = 29; offset >= 0; offset--) {
    for (const dose of dosesForDate(medications, schedules, toDateKey(subDays(now, offset)))) {
      if (dose.scheduledFor > nowKey) continue;
      n += 1;
      if (n % 11 === 5) continue;
      const skipped = n % 17 === 3;
      await logDose(db, {
        scheduleId: dose.scheduleId,
        scheduledFor: dose.scheduledFor,
        status: skipped ? 'skipped' : 'taken',
        takenAt: skipped ? null : dose.scheduledFor.replace(/:00$/, ':12'),
      });
    }
  }

  const diary: [number, number, string, number, number, number, number, string | null][] = [
    [-6, 2, 'none', 0, 1, 4, 0, null],
    [-5, 4, 'none', 1, 3, 5, 1, null],
    [-4, 8, 'lots', 3, 7, 6, 3, 'Começou a crise'],
    [-3, 7, 'little', 3, 6, 6, 3, null],
    [-2, 5, 'little', 2, 4, 5, 2, 'Melhorando'],
    [-1, 3, 'none', 1, 2, 4, 1, null],
  ];
  for (const [offset, bowel, blood, urgency, pain, bristol, fatigue, notes] of diary) {
    await saveDiaryEntry(db, {
      conditionId: 'rcu',
      date: day(offset),
      values: { bowel_count: bowel, blood, urgency, pain, bristol, fatigue },
      notes,
    });
  }
  await createEpisode(db, { conditionId: 'rcu', startDate: day(-4), endDate: day(-2), notes: null });

  const consultation = await createAppointment(db, {
    conditionId: 'rcu',
    datetime: at(5, '14:30'),
    type: 'consultation',
    professional: 'Gastroenterologista',
    location: 'Clínica do bairro, sala 12',
    notes: 'Levar os últimos exames',
    remind1d: true,
    remind2h: true,
  });
  await createAppointment(db, {
    conditionId: 'rcu',
    datetime: at(12, '07:30'),
    type: 'exam',
    professional: 'Laboratório',
    location: 'Laboratório central',
    notes: 'Calprotectina fecal',
    remind1d: true,
    remind2h: false,
  });
  const infusion = await createAppointment(db, {
    conditionId: 'rcu',
    datetime: at(-20, '09:00'),
    type: 'infusion',
    professional: 'Enfermagem',
    location: 'Centro de infusão',
    notes: null,
    remind1d: true,
    remind2h: true,
  });

  await createQuestion(db, {
    appointmentId: consultation,
    question: 'Posso diminuir a prednisona de novo?',
    answer: null,
    asked: false,
  });
  await createQuestion(db, {
    appointmentId: consultation,
    question: 'A crise da semana passada muda o tratamento?',
    answer: null,
    asked: false,
  });
  await createQuestion(db, {
    appointmentId: infusion,
    question: 'Quando é a próxima infusão?',
    answer: 'Daqui a 8 semanas.',
    asked: true,
  });
}
