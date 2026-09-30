import { format, isValid, parseISO } from 'date-fns';
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
