import { loadExampleData, clearAllData } from '@/db/devData';
import { createMigratedDb } from '@/testing/testDb';

import {
  countOpenQuestions,
  createAppointment,
  createQuestion,
  getNextAppointment,
  listQuestions,
  setQuestionAsked,
} from '../appointments';
import { getPrimaryCondition } from '../conditions';
import { getDiaryEntry, getPreviousDiaryEntry, listDiaryEntries, saveDiaryEntry } from '../diary';
import { clearDoseLog, getAdherence, getDosesForDate, logDose } from '../doses';
import {
  createMedication,
  getMedication,
  listMedications,
  listSchedules,
  setMedicationStatus,
  updateMedication,
} from '../medications';

async function setup() {
  const db = await createMigratedDb();
  const id = await createMedication(db, {
    conditionId: 'rcu',
    name: 'Mesalazina',
    dose: '2 comprimidos de 800 mg',
    form: 'tablet',
    notes: null,
    startDate: '2026-09-01',
    endDate: null,
    schedules: [
      { frequency: 'daily', intervalDays: null, timeOfDay: '20:00' },
      { frequency: 'daily', intervalDays: null, timeOfDay: '08:00' },
    ],
  });
  return { db, id };
}

describe('medications', () => {
  it('grava remédio e horários e lê de volta em camelCase', async () => {
    const { db, id } = await setup();
    expect(await getMedication(db, id)).toMatchObject({
      name: 'Mesalazina',
      status: 'active',
      startDate: '2026-09-01',
      endDate: null,
      conditionId: 'rcu',
    });
    expect((await listSchedules(db, id)).map((s) => s.timeOfDay)).toEqual(['08:00', '20:00']);
    expect(await listMedications(db)).toHaveLength(1);
    db.close();
  });
});

describe('updateMedication', () => {
  const draft = {
    name: 'Mesalazina MMX',
    dose: '2 comprimidos de 1,2 g',
    form: 'tablet' as const,
    notes: null,
    startDate: '2026-09-01',
    endDate: null,
  };

  it('mantém horários iguais, encerra removidos com histórico e apaga os sem histórico', async () => {
    const { db, id } = await setup();
    const [morning, evening] = await listSchedules(db, id);
    await logDose(db, { scheduleId: evening.id, scheduledFor: '2026-09-29T20:00:00', status: 'taken', takenAt: null });

    await updateMedication(
      db,
      id,
      {
        ...draft,
        schedules: [
          { frequency: 'daily', intervalDays: null, timeOfDay: '08:00' },
          { frequency: 'daily', intervalDays: null, timeOfDay: '21:00' },
        ],
      },
      '2026-09-30',
    );

    expect(await getMedication(db, id)).toMatchObject({ name: 'Mesalazina MMX', dose: '2 comprimidos de 1,2 g' });
    const schedules = await listSchedules(db, id);
    expect(schedules.find((s) => s.id === morning.id)).toMatchObject({ timeOfDay: '08:00', endsOn: null });
    expect(schedules.find((s) => s.id === evening.id)).toMatchObject({ endsOn: '2026-09-29' });
    expect(schedules.find((s) => s.timeOfDay === '21:00')).toMatchObject({ startsOn: '2026-09-30' });

    // O histórico de ontem continua de pé; hoje vale o horário novo.
    expect((await getDosesForDate(db, '2026-09-29')).map((d) => [d.scheduledFor.slice(11, 16), d.status])).toEqual([
      ['08:00', 'pending'],
      ['20:00', 'taken'],
    ]);
    expect((await getDosesForDate(db, '2026-09-30')).map((d) => d.scheduledFor.slice(11, 16))).toEqual([
      '08:00',
      '21:00',
    ]);
    db.close();
  });

  it('apaga horário removido que nunca teve dose marcada', async () => {
    const { db, id } = await setup();
    await updateMedication(
      db,
      id,
      { ...draft, schedules: [{ frequency: 'daily', intervalDays: null, timeOfDay: '08:00' }] },
      '2026-09-30',
    );
    expect((await listSchedules(db, id)).map((s) => s.timeOfDay)).toEqual(['08:00']);
    db.close();
  });

  it('pausa e reativa sem perder dados', async () => {
    const { db, id } = await setup();
    await setMedicationStatus(db, id, 'paused');
    expect(await getDosesForDate(db, '2026-09-30')).toHaveLength(0);
    await setMedicationStatus(db, id, 'active');
    expect(await getDosesForDate(db, '2026-09-30')).toHaveLength(2);
    db.close();
  });
});

describe('doses', () => {
  it('desfaz uma marcação', async () => {
    const { db } = await setup();
    const [first] = await getDosesForDate(db, '2026-09-30');
    await logDose(db, { scheduleId: first.scheduleId, scheduledFor: first.scheduledFor, status: 'skipped', takenAt: null });
    await clearDoseLog(db, first.scheduleId, first.scheduledFor);
    expect((await getDosesForDate(db, '2026-09-30'))[0].status).toBe('pending');
    db.close();
  });

  it('marca, remarca e cruza com as doses do dia', async () => {
    const { db } = await setup();
    const [first] = await getDosesForDate(db, '2026-09-30');
    await logDose(db, { scheduleId: first.scheduleId, scheduledFor: first.scheduledFor, status: 'skipped', takenAt: null });
    await logDose(db, {
      scheduleId: first.scheduleId,
      scheduledFor: first.scheduledFor,
      status: 'taken',
      takenAt: '2026-09-30T08:05:00',
    });

    const doses = await getDosesForDate(db, '2026-09-30');
    expect(doses.map((d) => d.status)).toEqual(['taken', 'pending']);
    expect(doses[0].takenAt).toBe('2026-09-30T08:05:00');
    const rows = await db.getAllAsync('SELECT * FROM dose_logs');
    expect(rows).toHaveLength(1);
    db.close();
  });

  it('calcula a adesão a partir dos registros', async () => {
    const { db } = await setup();
    const now = new Date(2026, 8, 30, 21, 0, 0);
    for (const dose of await getDosesForDate(db, '2026-09-30')) {
      await logDose(db, { scheduleId: dose.scheduleId, scheduledFor: dose.scheduledFor, status: 'taken', takenAt: null });
    }
    const adherence = await getAdherence(db, now);
    expect(adherence.last7).toBeCloseTo(2 / 14);
    db.close();
  });
});

describe('diary', () => {
  it('guarda um registro por dia e acha o anterior', async () => {
    const db = await createMigratedDb();
    const condition = await getPrimaryCondition(db);
    expect(condition.id).toBe('rcu');

    await saveDiaryEntry(db, { conditionId: 'rcu', date: '2026-09-28', values: { pain: 5 }, notes: null });
    await saveDiaryEntry(db, { conditionId: 'rcu', date: '2026-09-29', values: { pain: 3 }, notes: 'a' });
    await saveDiaryEntry(db, { conditionId: 'rcu', date: '2026-09-29', values: { pain: 2 }, notes: 'b' });

    expect(await getDiaryEntry(db, 'rcu', '2026-09-29')).toMatchObject({ values: { pain: 2 }, notes: 'b' });
    expect((await getPreviousDiaryEntry(db, 'rcu', '2026-09-29'))?.date).toBe('2026-09-28');
    expect((await listDiaryEntries(db, 'rcu')).map((e) => e.date)).toEqual(['2026-09-29', '2026-09-28']);
    db.close();
  });
});

describe('appointments', () => {
  it('acha a próxima consulta e conta perguntas em aberto', async () => {
    const db = await createMigratedDb();
    const base = { conditionId: 'rcu', type: 'consultation' as const, professional: null, location: null, notes: null };
    await createAppointment(db, { ...base, datetime: '2026-09-01T10:00:00', remind1d: true, remind2h: false });
    const next = await createAppointment(db, { ...base, datetime: '2026-10-05T14:30:00', remind1d: true, remind2h: true });
    const q1 = await createQuestion(db, { appointmentId: next, question: 'A?', answer: null, asked: false });
    await createQuestion(db, { appointmentId: next, question: 'B?', answer: null, asked: false });

    expect((await getNextAppointment(db, '2026-09-30T00:00:00'))?.id).toBe(next);
    expect(await countOpenQuestions(db)).toEqual({ [next]: 2 });

    await setQuestionAsked(db, q1, true);
    expect(await countOpenQuestions(db)).toEqual({ [next]: 1 });
    expect((await listQuestions(db, next)).map((q) => q.asked)).toEqual([true, false]);
    db.close();
  });
});

describe('dados de exemplo', () => {
  it('carregam e são apagados sem erro', async () => {
    const db = await createMigratedDb();
    await loadExampleData(db, new Date(2026, 8, 30, 12, 0, 0));
    expect(await listMedications(db)).toHaveLength(5);
    expect((await getAdherence(db, new Date(2026, 8, 30, 12, 0, 0))).last30).not.toBeNull();

    await clearAllData(db);
    expect(await listMedications(db)).toHaveLength(0);
    expect(await getPrimaryCondition(db)).toMatchObject({ id: 'rcu' });
    db.close();
  });
});
