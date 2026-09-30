import {
  appointmentFormSchema,
  appointmentFormToDraft,
  appointmentToForm,
  emptyAppointmentForm,
} from '../appointmentForm';

describe('appointmentForm', () => {
  it('aceita o formulário padrão', () => {
    expect(appointmentFormSchema.safeParse(emptyAppointmentForm('2026-09-30')).success).toBe(true);
  });

  it('recusa data e hora inválidas', () => {
    const result = appointmentFormSchema.safeParse({ ...emptyAppointmentForm('2026-09-30'), date: '2026-02-30', time: '9h' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((i) => i.path[0]).sort()).toEqual(['date', 'time']);
  });

  it('converte para o banco e volta sem perder nada', () => {
    const draft = appointmentFormToDraft({
      ...emptyAppointmentForm('2026-09-30'),
      date: '2026-10-05',
      time: '14:30',
      professional: ' Dra. A ',
      location: '',
      remind2h: false,
    });
    expect(draft).toEqual({
      datetime: '2026-10-05T14:30:00',
      type: 'consultation',
      professional: 'Dra. A',
      location: null,
      notes: null,
      remind1d: true,
      remind2h: false,
    });
    expect(appointmentToForm({ id: 1, conditionId: 'rcu', ...draft })).toMatchObject({
      date: '2026-10-05',
      time: '14:30',
      professional: 'Dra. A',
      location: '',
    });
  });
});
