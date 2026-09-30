import { addDays, format, parseISO, subDays, subHours } from 'date-fns';

import { toDateKey, toDateTimeKey } from '@/domain/dates';
import { appointmentTypeLabels } from '@/domain/labels';
import { doseKey, dosesForDate } from '@/domain/schedule';
import type { Appointment, DoseLog, Medication, MedicationSchedule } from '@/domain/types';

/** O iOS guarda até 64 notificações pendentes por app; ficamos abaixo com folga. */
export const NOTIFICATION_BUDGET = 60;
/** Até quantos dias à frente procurar doses. */
export const HORIZON_DAYS = 30;

export interface PlannedNotification {
  /** Determinístico: permite cancelar uma notificação sem guardar ids no banco. */
  identifier: string;
  date: Date;
  title: string;
  body: string;
  /** Rota aberta ao tocar na notificação. */
  url: string;
}

export interface PlanInput {
  medications: Medication[];
  schedules: MedicationSchedule[];
  /** Marcações a partir de hoje: doses já marcadas não geram lembrete. */
  logs: DoseLog[];
  appointments: Appointment[];
  now: Date;
  budget?: number;
}

export function doseNotificationId(scheduleId: number, scheduledFor: string): string {
  return `dose:${doseKey(scheduleId, scheduledFor)}`;
}

/**
 * Lista das notificações a agendar, da mais próxima para a mais distante, dentro do orçamento.
 * Tudo usa gatilho de data única: pausas, términos, horários encerrados e doses já marcadas
 * são respeitados porque a lista vem de `dosesForDate`, a mesma fonte da tela Hoje.
 * Se o orçamento acabar antes do horizonte, a última vaga vira um aviso para abrir o app.
 */
export function planNotifications({
  medications,
  schedules,
  logs,
  appointments,
  now,
  budget = NOTIFICATION_BUDGET,
}: PlanInput): PlannedNotification[] {
  const nowKey = toDateTimeKey(now);
  const marked = new Set(logs.map((l) => doseKey(l.scheduleId, l.scheduledFor)));
  const all: PlannedNotification[] = [];

  for (let offset = 0; offset < HORIZON_DAYS; offset++) {
    const date = toDateKey(addDays(now, offset));
    for (const dose of dosesForDate(medications, schedules, date)) {
      if (dose.scheduledFor <= nowKey || marked.has(doseKey(dose.scheduleId, dose.scheduledFor))) continue;
      all.push({
        identifier: doseNotificationId(dose.scheduleId, dose.scheduledFor),
        date: parseISO(dose.scheduledFor),
        title: dose.medicationName,
        body: `Hora de tomar: ${dose.dose}`,
        url: '/',
      });
    }
  }

  for (const appointment of appointments) {
    const at = parseISO(appointment.datetime);
    const type = appointmentTypeLabels[appointment.type];
    const time = format(at, 'HH:mm');
    const where = appointment.location ? `, ${appointment.location}` : '';
    const url = `/appointments/${appointment.id}`;

    if (appointment.remind1d) {
      all.push({
        identifier: `appt:${appointment.id}:1d`,
        date: subDays(at, 1),
        title: `${type} amanhã`,
        body: `Amanhã às ${time}${where}`,
        url,
      });
    }
    if (appointment.remind2h) {
      all.push({
        identifier: `appt:${appointment.id}:2h`,
        date: subHours(at, 2),
        title: `${type} em 2 horas`,
        body: `Às ${time}${where}`,
        url,
      });
    }
  }

  const upcoming = all.filter((n) => n.date > now).sort((a, b) => a.date.getTime() - b.date.getTime());
  if (upcoming.length <= budget) return upcoming;

  // Orçamento estourado: agenda as mais próximas e usa a última vaga para lembrar de abrir o app,
  // que renova a janela.
  const kept = upcoming.slice(0, budget - 1);
  const last = kept[kept.length - 1];
  kept.push({
    identifier: 'renew',
    date: new Date(last.date.getTime() + 60 * 1000),
    title: 'Seus lembretes estão acabando',
    body: 'Abra o App RCU para agendar os próximos lembretes de remédios e consultas.',
    url: '/',
  });
  return kept;
}
