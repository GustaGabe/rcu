import { subDays } from 'date-fns';

import { toDateKey, toDateTimeKey } from './dates';
import { doseKey, dosesForDate } from './schedule';
import type { DoseLog, Medication, MedicationSchedule } from './types';

/**
 * Fração das doses previstas nos últimos `days` dias (incluindo hoje até agora)
 * que foram marcadas como tomadas. `null` quando não havia dose prevista.
 * Remédios pausados ou arquivados não entram na conta.
 */
export function adherenceRatio(
  medications: Medication[],
  schedules: MedicationSchedule[],
  logs: DoseLog[],
  days: number,
  now: Date,
): number | null {
  const nowKey = toDateTimeKey(now);
  const taken = new Set(logs.filter((l) => l.status === 'taken').map((l) => doseKey(l.scheduleId, l.scheduledFor)));
  let expected = 0;
  let done = 0;

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = toDateKey(subDays(now, offset));
    for (const dose of dosesForDate(medications, schedules, date)) {
      if (dose.scheduledFor > nowKey) continue;
      expected += 1;
      if (taken.has(doseKey(dose.scheduleId, dose.scheduledFor))) done += 1;
    }
  }

  return expected === 0 ? null : done / expected;
}
