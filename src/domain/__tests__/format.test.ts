import { describeSchedules, formatPercent, isDateInEpisode } from '../format';
import type { Episode, MedicationSchedule } from '../types';

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

describe('describeSchedules', () => {
  it('junta os horários diários em ordem', () => {
    expect(
      describeSchedules([
        schedule({ timeOfDay: '20:00' }),
        schedule({ timeOfDay: '08:00' }),
        schedule({ timeOfDay: '14:00' }),
      ]),
    ).toBe('Todo dia às 08:00, 14:00 e 20:00');
  });

  it('descreve intervalos', () => {
    expect(describeSchedules([schedule({ frequency: 'interval', intervalDays: 56, timeOfDay: '09:00' })])).toBe(
      'A cada 56 dias às 09:00',
    );
  });

  it('trata lista vazia', () => {
    expect(describeSchedules([])).toBe('Sem horário');
  });
});

describe('isDateInEpisode', () => {
  const episodes: Episode[] = [
    { id: 1, conditionId: 'rcu', startDate: '2026-09-10', endDate: '2026-09-12', notes: null },
    { id: 2, conditionId: 'rcu', startDate: '2026-09-25', endDate: null, notes: null },
  ];

  it('inclui início e fim', () => {
    expect(isDateInEpisode('2026-09-10', episodes)).toBe(true);
    expect(isDateInEpisode('2026-09-12', episodes)).toBe(true);
    expect(isDateInEpisode('2026-09-13', episodes)).toBe(false);
  });

  it('considera episódio em andamento', () => {
    expect(isDateInEpisode('2026-09-30', episodes)).toBe(true);
    expect(isDateInEpisode('2026-09-24', episodes)).toBe(false);
  });
});

describe('formatPercent', () => {
  it('arredonda', () => {
    expect(formatPercent(0.925)).toBe('93%');
  });
});
