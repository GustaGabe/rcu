import type { AppointmentType, MedicationForm, MedicationStatus } from './types';

export const medicationFormLabels: Record<MedicationForm, string> = {
  tablet: 'Comprimido',
  suppository: 'Supositório',
  enema: 'Enema',
  injection: 'Injeção',
  infusion: 'Infusão',
  other: 'Outro',
};

export const medicationStatusLabels: Record<MedicationStatus, string> = {
  active: 'Ativos',
  paused: 'Pausados',
  archived: 'Arquivados',
};

export const medicationStatusSingular: Record<MedicationStatus, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  archived: 'Arquivado',
};

export const appointmentTypeLabels: Record<AppointmentType, string> = {
  consultation: 'Consulta',
  exam: 'Exame',
  infusion: 'Infusão',
};
