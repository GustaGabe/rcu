import { adherenceRatio } from '../adherence';
import type { DoseLog, Medication, MedicationSchedule } from '../types';

const medication: Medication = {
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
};

const schedules: MedicationSchedule[] = [
  { id: 1, medicationId: 1, frequency: 'daily', intervalDays: null, timeOfDay: '08:00', notificationId: null, startsOn: null, endsOn: null },
  { id: 2, medicationId: 1, frequency: 'daily', intervalDays: null, timeOfDay: '20:00', notificationId: null, startsOn: null, endsOn: null },
];

const taken = (scheduleId: number, scheduledFor: string): DoseLog => ({
  id: 0,
  scheduleId,
  scheduledFor,
  status: 'taken',
  takenAt: scheduledFor,
});

describe('adherenceRatio', () => {
  // 30/09/2026 às 12:00: a dose das 20:00 de hoje ainda não conta.
  const now = new Date(2026, 8, 30, 12, 0, 0);

  it('conta só as doses que já passaram', () => {
    const logs = [taken(1, '2026-09-30T08:00:00'), taken(1, '2026-09-29T08:00:00'), taken(2, '2026-09-29T20:00:00')];
    // Últimos 2 dias: 29 (2 doses) + 30 (1 dose até agora) = 3, todas tomadas.
    expect(adherenceRatio([medication], schedules, logs, 2, now)).toBe(1);
  });

  it('pula não conta como tomada', () => {
    const logs: DoseLog[] = [
      taken(1, '2026-09-30T08:00:00'),
      { id: 0, scheduleId: 1, scheduledFor: '2026-09-29T08:00:00', status: 'skipped', takenAt: null },
    ];
    expect(adherenceRatio([medication], schedules, logs, 2, now)).toBeCloseTo(1 / 3);
  });

  it('devolve null sem doses previstas', () => {
    expect(adherenceRatio([{ ...medication, status: 'paused' }], schedules, [], 7, now)).toBeNull();
  });
});
