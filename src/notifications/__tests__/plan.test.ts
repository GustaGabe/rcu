import type { Appointment, Medication, MedicationSchedule } from '@/domain/types';

import { planNotifications } from '../plan';

const med = (overrides: Partial<Medication> = {}): Medication => ({
  id: 1,
  conditionId: 'rcu',
  name: 'Mesalazina',
  dose: '2 comprimidos de 800 mg',
  form: 'tablet',
  notes: null,
  status: 'active',
  startDate: '2026-09-01',
  endDate: null,
  createdAt: '2026-09-01T10:00:00',
  ...overrides,
});

const schedule = (overrides: Partial<MedicationSchedule> = {}): MedicationSchedule => ({
  id: 1,
  medicationId: 1,
  frequency: 'daily',
  intervalDays: null,
  timeOfDay: '08:00',
  notificationId: null,
  startsOn: null,
  endsOn: null,
  ...overrides,
});

const appointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 7,
  conditionId: 'rcu',
  datetime: '2026-10-05T14:30:00',
  type: 'consultation',
  professional: null,
  location: 'Clínica',
  notes: null,
  remind1d: true,
  remind2h: true,
  ...overrides,
});

// 30/09/2026 às 12:00
const now = new Date(2026, 8, 30, 12, 0, 0);

describe('planNotifications', () => {
  it('agenda só doses futuras, com id determinístico', () => {
    const plan = planNotifications({
      medications: [med({ endDate: '2026-10-01' })],
      schedules: [schedule({ id: 1, timeOfDay: '08:00' }), schedule({ id: 2, timeOfDay: '20:00' })],
      logs: [],
      appointments: [],
      now,
    });
    expect(plan.map((n) => n.identifier)).toEqual([
      'dose:2@2026-09-30T20:00:00',
      'dose:1@2026-10-01T08:00:00',
      'dose:2@2026-10-01T20:00:00',
    ]);
    expect(plan[0]).toMatchObject({ title: 'Mesalazina', body: 'Hora de tomar: 2 comprimidos de 800 mg', url: '/' });
  });

  it('não lembra dose já marcada, pausada ou de horário encerrado', () => {
    const base = { appointments: [], now };
    const logs = [{ id: 1, scheduleId: 1, scheduledFor: '2026-09-30T20:00:00', status: 'taken' as const, takenAt: null }];
    const oneDay = { medications: [med({ endDate: '2026-09-30' })], schedules: [schedule({ timeOfDay: '20:00' })] };

    expect(planNotifications({ ...base, ...oneDay, logs })).toEqual([]);
    expect(planNotifications({ ...base, ...oneDay, medications: [med({ status: 'paused' })], logs: [] })).toEqual([]);
    expect(
      planNotifications({ ...base, medications: [med()], schedules: [schedule({ endsOn: '2026-09-29' })], logs: [] }),
    ).toEqual([]);
  });

  it('avisa das consultas um dia e duas horas antes', () => {
    const plan = planNotifications({ medications: [], schedules: [], logs: [], appointments: [appointment()], now });
    expect(plan.map((n) => [n.identifier, n.date.toISOString(), n.title, n.body])).toEqual([
      ['appt:7:1d', new Date(2026, 9, 4, 14, 30).toISOString(), 'Consulta amanhã', 'Amanhã às 14:30, Clínica'],
      ['appt:7:2h', new Date(2026, 9, 5, 12, 30).toISOString(), 'Consulta em 2 horas', 'Às 14:30, Clínica'],
    ]);
    expect(plan[0].url).toBe('/appointments/7');
  });

  it('respeita os lembretes desligados e ignora os que já passaram', () => {
    const tomorrow = appointment({ datetime: '2026-09-30T13:00:00', remind1d: true, remind2h: true });
    const plan = planNotifications({ medications: [], schedules: [], logs: [], appointments: [tomorrow], now });
    expect(plan).toEqual([]);
    const off = appointment({ remind1d: false });
    expect(planNotifications({ medications: [], schedules: [], logs: [], appointments: [off], now }).map((n) => n.identifier)).toEqual([
      'appt:7:2h',
    ]);
  });

  it('corta no orçamento e usa a última vaga para pedir que o app seja aberto', () => {
    const plan = planNotifications({
      medications: [med()],
      schedules: [schedule({ id: 1, timeOfDay: '08:00' }), schedule({ id: 2, timeOfDay: '20:00' })],
      logs: [],
      appointments: [],
      now,
      budget: 5,
    });
    expect(plan).toHaveLength(5);
    expect(plan[4].identifier).toBe('renew');
    expect(plan[4].date.getTime()).toBeGreaterThan(plan[3].date.getTime());
  });
});
