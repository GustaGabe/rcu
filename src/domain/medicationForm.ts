import { z } from 'zod';

import { isDateKey } from './dates';
import type { ISODate, Medication, MedicationDraft, MedicationForm, MedicationSchedule } from './types';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const FORMS = ['tablet', 'suppository', 'enema', 'injection', 'infusion', 'other'] as const satisfies readonly MedicationForm[];

const time = z.string().regex(TIME, 'Horário inválido.');
const date = z.string().refine(isDateKey, 'Data inválida.');

/** Validação do cadastro/edição de remédio (M1). */
export const medicationFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome do remédio.').max(80, 'Use até 80 caracteres.'),
    dose: z.string().trim().min(1, 'Informe a dose, como "2 comprimidos de 800 mg".').max(120, 'Use até 120 caracteres.'),
    form: z.enum(FORMS),
    notes: z.string().trim().max(500, 'Use até 500 caracteres.'),
    frequency: z.enum(['daily', 'interval']),
    /** Horários do modo diário. */
    times: z.array(time),
    intervalValue: z.number().int('Use um número inteiro.').min(1, 'Mínimo de 1.').max(365, 'Máximo de 365.'),
    intervalUnit: z.enum(['days', 'weeks']),
    /** Horário do modo intervalo. */
    intervalTime: time,
    startDate: date,
    hasEndDate: z.boolean(),
    endDate: date,
  })
  .superRefine((v, ctx) => {
    if (v.frequency === 'daily') {
      if (v.times.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['times'], message: 'Adicione pelo menos um horário.' });
      } else if (new Set(v.times).size !== v.times.length) {
        ctx.addIssue({ code: 'custom', path: ['times'], message: 'Há horários repetidos.' });
      }
    }
    if (v.hasEndDate && v.endDate < v.startDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'O término não pode ser antes do início.' });
    }
  });

export type MedicationFormValues = z.infer<typeof medicationFormSchema>;

/** Sugestões para o próximo horário adicionado, na ordem. */
const SUGGESTED_TIMES = ['08:00', '20:00', '14:00', '22:00', '06:00', '12:00', '18:00'];

export function suggestNextTime(times: string[]): string {
  return SUGGESTED_TIMES.find((t) => !times.includes(t)) ?? '08:00';
}

export function emptyMedicationForm(today: ISODate): MedicationFormValues {
  return {
    name: '',
    dose: '',
    form: 'tablet',
    notes: '',
    frequency: 'daily',
    times: ['08:00'],
    intervalValue: 1,
    intervalUnit: 'weeks',
    intervalTime: '09:00',
    startDate: today,
    hasEndDate: false,
    endDate: today,
  };
}

/** Preenche o formulário de edição. `schedules` são os horários em vigor. */
export function medicationToForm(med: Medication, schedules: MedicationSchedule[], today: ISODate): MedicationFormValues {
  const base = emptyMedicationForm(today);
  const interval = schedules.find((s) => s.frequency === 'interval');
  const daily = schedules.filter((s) => s.frequency === 'daily').map((s) => s.timeOfDay).sort();
  const days = interval?.intervalDays ?? 7;
  const inWeeks = days % 7 === 0;

  return {
    ...base,
    name: med.name,
    dose: med.dose,
    form: med.form,
    notes: med.notes ?? '',
    frequency: interval ? 'interval' : 'daily',
    times: daily.length > 0 ? daily : base.times,
    intervalValue: inWeeks ? days / 7 : days,
    intervalUnit: inWeeks ? 'weeks' : 'days',
    intervalTime: interval?.timeOfDay ?? base.intervalTime,
    startDate: med.startDate,
    hasEndDate: med.endDate !== null,
    endDate: med.endDate ?? med.startDate,
  };
}

/** Converte o formulário validado no que os repositórios gravam. */
export function formToDraft(values: MedicationFormValues): MedicationDraft {
  const schedules =
    values.frequency === 'daily'
      ? [...values.times].sort().map((t) => ({ frequency: 'daily' as const, intervalDays: null, timeOfDay: t }))
      : [
          {
            frequency: 'interval' as const,
            intervalDays: values.intervalUnit === 'weeks' ? values.intervalValue * 7 : values.intervalValue,
            timeOfDay: values.intervalTime,
          },
        ];

  return {
    name: values.name.trim(),
    dose: values.dose.trim(),
    form: values.form,
    notes: values.notes.trim() === '' ? null : values.notes.trim(),
    startDate: values.startDate,
    endDate: values.hasEndDate ? values.endDate : null,
    schedules,
  };
}
