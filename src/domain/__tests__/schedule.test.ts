import { applyDoseLogs, dosesForDate } from '../schedule';
import type { Medication, MedicationSchedule } from '../types';

function med(overrides: Partial<Medication>): Medication {
  return {
    id: 1,
    conditionId: 'rcu',
    name: 'Mesalazina',
    dose: '800 mg',
    form: 'tablet',
    notes: null,
    status: 'active',
    startDate: '2026-09-01',
    endDate: null,
    createdAt: '2026-09-01T10:00:00',
    ...overrides,
  };
}

function schedule(overrides: Partial<MedicationSchedule>): MedicationSchedule {
  return {
    id: 1,
    medicationId: 1,
    frequency: 'daily',
    intervalDays: null,
    timeOfDay: '08:00',
    notificationId: null,
    startsOn: null,
    endsOn: null,
    ...overrides,
  };
}

describe('dosesForDate', () => {
  it('gera uma dose por horário diário, em ordem', () => {
    const doses = dosesForDate(
      [med({})],
      [schedule({ id: 2, timeOfDay: '20:00' }), schedule({ id: 1, timeOfDay: '08:00' })],
      '2026-09-30',
    );
    expect(doses.map((d) => d.scheduledFor)).toEqual(['2026-09-30T08:00:00', '2026-09-30T20:00:00']);
    expect(doses.every((d) => d.status === 'pending')).toBe(true);
    expect(doses[0]).toMatchObject({ medicationName: 'Mesalazina', dose: '800 mg', scheduleId: 1 });
  });

  it('respeita início e término (inclusivos)', () => {
    const meds = [med({ startDate: '2026-09-10', endDate: '2026-09-20' })];
    const s = [schedule({})];
    expect(dosesForDate(meds, s, '2026-09-09')).toHaveLength(0);
    expect(dosesForDate(meds, s, '2026-09-10')).toHaveLength(1);
    expect(dosesForDate(meds, s, '2026-09-20')).toHaveLength(1);
    expect(dosesForDate(meds, s, '2026-09-21')).toHaveLength(0);
  });

  it('calcula intervalos a partir da data de início', () => {
    const meds = [med({ startDate: '2026-09-01' })];
    const s = [schedule({ frequency: 'interval', intervalDays: 14 })];
    expect(dosesForDate(meds, s, '2026-09-01')).toHaveLength(1);
    expect(dosesForDate(meds, s, '2026-09-08')).toHaveLength(0);
    expect(dosesForDate(meds, s, '2026-09-15')).toHaveLength(1);
    expect(dosesForDate(meds, s, '2026-09-29')).toHaveLength(1);
  });

  it('ignora remédios pausados e arquivados', () => {
    const s = [schedule({})];
    expect(dosesForDate([med({ status: 'paused' })], s, '2026-09-30')).toHaveLength(0);
    expect(dosesForDate([med({ status: 'archived' })], s, '2026-09-30')).toHaveLength(0);
  });

  it('atravessa a mudança de horário de verão sem pular dias', () => {
    const meds = [med({ startDate: '2026-10-01' })];
    const s = [schedule({ frequency: 'interval', intervalDays: 7 })];
    expect(dosesForDate(meds, s, '2026-11-05')).toHaveLength(1);
  });
});

describe('applyDoseLogs', () => {
  it('aplica o status marcado à dose certa', () => {
    const doses = dosesForDate(
      [med({})],
      [schedule({ id: 1, timeOfDay: '08:00' }), schedule({ id: 2, timeOfDay: '20:00' })],
      '2026-09-30',
    );
    const result = applyDoseLogs(doses, [
      { id: 1, scheduleId: 1, scheduledFor: '2026-09-30T08:00:00', status: 'taken', takenAt: '2026-09-30T08:12:00' },
      { id: 2, scheduleId: 2, scheduledFor: '2026-09-29T20:00:00', status: 'taken', takenAt: null },
    ]);
    expect(result[0]).toMatchObject({ status: 'taken', takenAt: '2026-09-30T08:12:00' });
    expect(result[1].status).toBe('pending');
  });
});

describe('validade do horário', () => {
  it('respeita startsOn e endsOn do horário', () => {
    const s = [schedule({ startsOn: '2026-09-10', endsOn: '2026-09-20' })];
    expect(dosesForDate([med({})], s, '2026-09-09')).toHaveLength(0);
    expect(dosesForDate([med({})], s, '2026-09-10')).toHaveLength(1);
    expect(dosesForDate([med({})], s, '2026-09-20')).toHaveLength(1);
    expect(dosesForDate([med({})], s, '2026-09-21')).toHaveLength(0);
  });
});
