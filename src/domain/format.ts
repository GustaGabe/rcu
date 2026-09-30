import type { Episode, ISODate, MedicationSchedule } from './types';

/** "Todo dia às 08:00 e 20:00" ou "A cada 56 dias às 09:00". */
export function describeSchedules(schedules: MedicationSchedule[]): string {
  if (schedules.length === 0) return 'Sem horário';

  const daily = schedules.filter((s) => s.frequency === 'daily');
  const interval = schedules.filter((s) => s.frequency === 'interval');
  const parts: string[] = [];

  if (daily.length > 0) {
    parts.push(`Todo dia às ${joinPt(daily.map((s) => s.timeOfDay).sort())}`);
  }
  for (const s of interval) {
    parts.push(`A cada ${s.intervalDays} dias às ${s.timeOfDay}`);
  }
  return parts.join('; ');
}

export function isDateInEpisode(date: ISODate, episodes: Episode[]): boolean {
  return episodes.some((e) => e.startDate <= date && (e.endDate === null || date <= e.endDate));
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

function joinPt(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

/** Primeira letra maiúscula: "quarta-feira" → "Quarta-feira". */
export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
