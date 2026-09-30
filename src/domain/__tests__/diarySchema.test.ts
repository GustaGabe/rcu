import { conditions, getCondition, type ConditionDefinition } from '@/conditions';

import { buildDiarySchema, initialDiaryValues, valuesToSave } from '../diarySchema';

const rcu = getCondition('rcu');

const complete = {
  values: { bowel_count: 3, blood: 'none', urgency: 1, pain: 2, bristol: null, fatigue: null },
  notes: '',
};

function issues(condition: ConditionDefinition, input: unknown): Record<string, string> {
  const result = buildDiarySchema(condition).safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('buildDiarySchema', () => {
  it.each(conditions.map((c) => [c.id, c] as const))('gera um schema para %s', (_id, condition) => {
    expect(() => buildDiarySchema(condition)).not.toThrow();
  });

  it('aceita um registro com os obrigatórios e opcionais vazios', () => {
    expect(issues(rcu, complete)).toEqual({});
  });

  it('exige os campos obrigatórios', () => {
    const e = issues(rcu, { ...complete, values: { ...complete.values, pain: null, blood: null } });
    expect(e['values.pain']).toBe('Escolha um valor.');
    expect(e['values.blood']).toBe('Escolha uma opção.');
  });

  it('respeita as faixas da definição', () => {
    const e = issues(rcu, { ...complete, values: { ...complete.values, pain: 11, bowel_count: -1 } });
    expect(e['values.pain']).toBe('Entre 0 e 10.');
    expect(e['values.bowel_count']).toBe('Mínimo de 0.');
  });

  it('recusa opção que não existe', () => {
    expect(issues(rcu, { ...complete, values: { ...complete.values, blood: 'some' } })['values.blood']).toBe(
      'Escolha uma opção.',
    );
  });

  it('ignora campos aposentados', () => {
    const condition: ConditionDefinition = {
      ...rcu,
      fields: [...rcu.fields, { key: 'old_score', label: 'Antigo', type: 'scale', min: 0, max: 5, required: true, deprecated: true }],
    };
    expect(issues(condition, complete)).toEqual({});
  });
});

describe('initialDiaryValues', () => {
  const previous = { values: { bowel_count: 5, blood: 'little', urgency: 2, pain: 4, bristol: 6, fatigue: 2 } };

  it('usa o registro do dia quando existe', () => {
    const entry = { values: { ...previous.values, pain: 1 }, notes: 'ok' };
    expect(initialDiaryValues(rcu, entry, previous)).toMatchObject({ values: { pain: 1 }, notes: 'ok' });
  });

  it('senão, traz do registro anterior os campos com carryOver', () => {
    expect(initialDiaryValues(rcu, null, previous).values).toEqual(previous.values);
  });

  it('começa vazio sem registro anterior', () => {
    const { values, notes } = initialDiaryValues(rcu, null, null);
    expect(Object.values(values).every((v) => v === null)).toBe(true);
    expect(notes).toBe('');
  });
});

describe('valuesToSave', () => {
  it('preserva chaves antigas do registro', () => {
    expect(valuesToSave({ old_score: 3, pain: 5 }, { values: { pain: 2 }, notes: '' })).toEqual({ old_score: 3, pain: 2 });
  });
});
