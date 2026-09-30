import { differenceInCalendarDays, parseISO } from 'date-fns';

import type { DoseLog, ISODate, ISODateTime, Medication, MedicationSchedule, ScheduledDose } from './types';

/** Identidade de uma dose: o mesmo par é único em `dose_logs`. */
export function doseKey(scheduleId: number, scheduledFor: ISODateTime): string {
  return `${scheduleId}@${scheduledFor}`;
}

/** A dose do horário cai nesta data? Considera início, término e intervalo. */
export function scheduleFallsOn(medication: Medication, schedule: MedicationSchedule, date: ISODate): boolean {
  if (date < medication.startDate) return false;
  if (medication.endDate !== null && date > medication.endDate) return false;
  if (schedule.frequency === 'daily') return true;

  const interval = schedule.intervalDays ?? 0;
  if (interval <= 0) return false;
  return differenceInCalendarDays(parseISO(date), parseISO(medication.startDate)) % interval === 0;
}

/**
 * Doses previstas numa data, todas como `pending`. Só remédios ativos geram doses.
 * Nada disso é gravado: o que o usuário marca vai para `dose_logs` (ver `applyDoseLogs`).
 */
export function dosesForDate(
  medications: Medication[],
  schedules: MedicationSchedule[],
  date: ISODate,
): ScheduledDose[] {
  const byId = new Map(medications.map((m) => [m.id, m]));
  const doses: ScheduledDose[] = [];

  for (const schedule of schedules) {
    const medication = byId.get(schedule.medicationId);
    if (!medication || medication.status !== 'active') continue;
    if (!scheduleFallsOn(medication, schedule, date)) continue;

    doses.push({
      scheduleId: schedule.id,
      medicationId: medication.id,
      medicationName: medication.name,
      dose: medication.dose,
      scheduledFor: `${date}T${schedule.timeOfDay}:00`,
      status: 'pending',
      takenAt: null,
    });
  }

  return doses.sort(
    (a, b) => a.scheduledFor.localeCompare(b.scheduledFor) || a.medicationName.localeCompare(b.medicationName),
  );
}

/** Cruza as doses previstas com o que o usuário marcou. */
export function applyDoseLogs(doses: ScheduledDose[], logs: DoseLog[]): ScheduledDose[] {
  const byKey = new Map(logs.map((l) => [doseKey(l.scheduleId, l.scheduledFor), l]));
  return doses.map((dose) => {
    const log = byKey.get(doseKey(dose.scheduleId, dose.scheduledFor));
    return log ? { ...dose, status: log.status, takenAt: log.takenAt } : dose;
  });
}
