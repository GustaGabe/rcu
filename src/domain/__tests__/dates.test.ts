import {
  formatDateLong,
  formatDateShort,
  formatDateTime,
  formatRelativeDays,
  formatTime,
  formatWeekdayShort,
  isDateKey,
  toDateKey,
  toDateTimeKey,
} from '../dates';

describe('dates', () => {
  const date = new Date(2026, 8, 30, 8, 5, 9); // 30/09/2026 08:05:09, horário local

  it('gera chaves no horário local', () => {
    expect(toDateKey(date)).toBe('2026-09-30');
    expect(toDateTimeKey(date)).toBe('2026-09-30T08:05:09');
  });

  it('formata em pt-BR', () => {
    expect(formatDateLong('2026-09-30')).toBe('quarta-feira, 30 de setembro');
    expect(formatDateShort('2026-09-30')).toBe('30 set');
    expect(formatDateTime('2026-09-30T14:30:00')).toBe('30/09/2026 às 14:30');
    expect(formatTime('2026-09-30T14:30:00')).toBe('14:30');
  });

  it('valida chaves de data', () => {
    expect(isDateKey('2026-09-30')).toBe(true);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('30/09/2026')).toBe(false);
    expect(isDateKey(undefined)).toBe(false);
  });

  it('descreve dias relativos', () => {
    expect(formatRelativeDays('2026-09-30', date)).toBe('hoje');
    expect(formatRelativeDays('2026-10-01T07:00:00', date)).toBe('amanhã');
    expect(formatRelativeDays('2026-10-05', date)).toBe('em 5 dias');
    expect(formatRelativeDays('2026-09-29', date)).toBe('ontem');
    expect(formatRelativeDays('2026-09-10', date)).toBe('há 20 dias');
  });

  it('abrevia o dia da semana', () => {
    expect(formatWeekdayShort('2026-09-30')).toBe('Qua');
  });
});
