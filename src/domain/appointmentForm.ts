import { z } from 'zod';

import { isDateKey } from './dates';
import type { Appointment, AppointmentType, ISODate, ISODateTime } from './types';

const TYPES = ['consultation', 'exam', 'infusion'] as const satisfies readonly AppointmentType[];

/** Validação do cadastro/edição de consulta (C1). */
export const appointmentFormSchema = z.object({
  type: z.enum(TYPES),
  date: z.string().refine(isDateKey, 'Data inválida.'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido.'),
  professional: z.string().trim().max(80, 'Use até 80 caracteres.'),
  location: z.string().trim().max(120, 'Use até 120 caracteres.'),
  notes: z.string().trim().max(500, 'Use até 500 caracteres.'),
  remind1d: z.boolean(),
  remind2h: z.boolean(),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export interface AppointmentDraft {
  datetime: ISODateTime;
  type: AppointmentType;
  professional: string | null;
  location: string | null;
  notes: string | null;
  remind1d: boolean;
  remind2h: boolean;
}

export function emptyAppointmentForm(date: ISODate): AppointmentFormValues {
  return {
    type: 'consultation',
    date,
    time: '09:00',
    professional: '',
    location: '',
    notes: '',
    remind1d: true,
    remind2h: true,
  };
}

export function appointmentToForm(appointment: Appointment): AppointmentFormValues {
  return {
    type: appointment.type,
    date: appointment.datetime.slice(0, 10),
    time: appointment.datetime.slice(11, 16),
    professional: appointment.professional ?? '',
    location: appointment.location ?? '',
    notes: appointment.notes ?? '',
    remind1d: appointment.remind1d,
    remind2h: appointment.remind2h,
  };
}

const orNull = (text: string) => (text.trim() === '' ? null : text.trim());

export function appointmentFormToDraft(values: AppointmentFormValues): AppointmentDraft {
  return {
    datetime: `${values.date}T${values.time}:00`,
    type: values.type,
    professional: orNull(values.professional),
    location: orNull(values.location),
    notes: orNull(values.notes),
    remind1d: values.remind1d,
    remind2h: values.remind2h,
  };
}
