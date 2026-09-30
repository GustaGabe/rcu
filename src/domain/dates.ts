import { differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { ISODate, ISODateTime } from './types';

export function toDateKey(date: Date): ISODate {
  return format(date, 'yyyy-MM-dd');
}

export function todayKey(now: Date = new Date()): ISODate {
  return toDateKey(now);
}

export function isDateKey(value: unknown): value is ISODate {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value));
}

export function toDateTimeKey(date: Date): ISODateTime {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

/** "terça-feira, 30 de setembro" */
export function formatDateLong(date: ISODate): string {
  return format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR });
}

/** "quarta-feira" */
export function formatWeekdayLong(date: ISODate): string {
  return format(parseISO(date), 'EEEE', { locale: ptBR });
}

/** "30 de setembro" */
export function formatDayMonth(date: ISODate): string {
  return format(parseISO(date), "d 'de' MMMM", { locale: ptBR });
}

/** "30 set 2026" */
export function formatDateMedium(date: ISODate): string {
  return format(parseISO(date), 'd MMM yyyy', { locale: ptBR });
}

/** "30 set" */
export function formatDateShort(date: ISODate): string {
  return format(parseISO(date), 'd MMM', { locale: ptBR });
}

/** "30/09/2026 às 14:30" */
export function formatDateTime(datetime: ISODateTime): string {
  return format(parseISO(datetime), "dd/MM/yyyy 'às' HH:mm");
}

/** "14:30" */
export function formatTime(datetime: ISODateTime): string {
  return format(parseISO(datetime), 'HH:mm');
}

/** "Qua" */
export function formatWeekdayShort(date: ISODate): string {
  const label = formatWeekdayLong(date).slice(0, 3);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "hoje", "amanhã", "em 5 dias", "ontem", "há 20 dias" */
export function formatRelativeDays(date: ISODate | ISODateTime, now: Date = new Date()): string {
  const days = differenceInCalendarDays(parseISO(date), now);
  if (days === 0) return 'hoje';
  if (days === 1) return 'amanhã';
  if (days === -1) return 'ontem';
  return days > 0 ? `em ${days} dias` : `há ${-days} dias`;
}
