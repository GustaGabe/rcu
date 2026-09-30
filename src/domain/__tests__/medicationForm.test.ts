import {
  emptyMedicationForm,
  formToDraft,
  medicationFormSchema,
  medicationToForm,
  suggestNextTime,
  type MedicationFormValues,
} from '../medicationForm';
import type { Medication, MedicationSchedule } from '../types';

const today = '2026-09-30';

function valid(overrides: Partial<MedicationFormValues> = {}): MedicationFormValues {
  return { ...emptyMedicationForm(today), name: 'Mesalazina', dose: '2 comprimidos de 800 mg', ...overrides };
}

function errors(values: MedicationFormValues): Record<string, string> {
  const result = medicationFormSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('medicationFormSchema', () => {
  it('aceita um cadastro diário válido', () => {
    expect(errors(valid())).toEqual({});
  });

  it('exige nome e dose, ignorando espaços', () => {
    const e = errors(valid({ name: '   ', dose: '' }));
    expect(e.name).toBe('Informe o nome do remédio.');
    expect(e.dose).toMatch(/Informe a dose/);
  });

  it('exige pelo menos um horário e sem repetição no modo diário', () => {
    expect(errors(valid({ times: [] })).times).toBe('Adicione pelo menos um horário.');
    expect(errors(valid({ times: ['08:00', '08:00'] })).times).toBe('Há horários repetidos.');
    expect(errors(valid({ times: ['25:00'] }))['times.0']).toBe('Horário inválido.');
  });

  it('não exige horários diários no modo intervalo', () => {
    expect(errors(valid({ frequency: 'interval', times: [] }))).toEqual({});
  });

  it('valida o intervalo', () => {
    expect(errors(valid({ frequency: 'interval', intervalValue: 0 })).intervalValue).toBe('Mínimo de 1.');
  });

  it('só valida o término quando ele está ligado', () => {
    expect(errors(valid({ hasEndDate: true, endDate: '2026-09-01' })).endDate).toBe(
      'O término não pode ser antes do início.',
    );
    expect(errors(valid({ hasEndDate: false, endDate: '2026-09-01' }))).toEqual({});
  });
});

describe('formToDraft', () => {
  it('ordena os horários diários e limpa textos', () => {
    const draft = formToDraft(valid({ name: ' Mesalazina ', notes: '  ', times: ['20:00', '08:00'] }));
    expect(draft).toMatchObject({ name: 'Mesalazina', notes: null, endDate: null });
    expect(draft.schedules.map((s) => s.timeOfDay)).toEqual(['08:00', '20:00']);
  });

  it('converte semanas em dias', () => {
    const draft = formToDraft(valid({ frequency: 'interval', intervalValue: 8, intervalUnit: 'weeks', intervalTime: '09:00' }));
    expect(draft.schedules).toEqual([{ frequency: 'interval', intervalDays: 56, timeOfDay: '09:00' }]);
  });
});

describe('medicationToForm', () => {
  const med: Medication = {
    id: 1,
    conditionId: 'rcu',
    name: 'Infliximabe',
    dose: '5 mg/kg',
    form: 'infusion',
    notes: null,
    status: 'active',
    startDate: '2026-06-01',
    endDate: null,
    createdAt: '2026-06-01T10:00:00',
  };
  const interval: MedicationSchedule = {
    id: 1,
    medicationId: 1,
    frequency: 'interval',
    intervalDays: 56,
    timeOfDay: '09:00',
    notificationId: null,
    startsOn: null,
    endsOn: null,
  };

  it('volta para semanas quando o intervalo é múltiplo de 7', () => {
    expect(medicationToForm(med, [interval], today)).toMatchObject({
      frequency: 'interval',
      intervalValue: 8,
      intervalUnit: 'weeks',
      intervalTime: '09:00',
      notes: '',
      hasEndDate: false,
    });
  });

  it('faz o caminho de ida e volta sem perder nada', () => {
    const form = medicationToForm(med, [{ ...interval, intervalDays: 10 }], today);
    expect(form).toMatchObject({ intervalValue: 10, intervalUnit: 'days' });
    expect(formToDraft(form).schedules[0].intervalDays).toBe(10);
  });
});

describe('suggestNextTime', () => {
  it('sugere o próximo horário livre', () => {
    expect(suggestNextTime([])).toBe('08:00');
    expect(suggestNextTime(['08:00'])).toBe('20:00');
  });
});
