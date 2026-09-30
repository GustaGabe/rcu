import { conditions, formatFieldValue, getCondition } from '..';

describe.each(conditions.map((c) => [c.id, c] as const))('definição %s', (_id, condition) => {
  it('tem chaves de campo únicas e em snake_case', () => {
    const keys = condition.fields.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key).toMatch(/^[a-z][a-z0-9_]*$/);
  });

  it('tem faixas e opções válidas', () => {
    for (const field of condition.fields) {
      if (field.type === 'scale') expect(field.min).toBeLessThan(field.max);
      if (field.type === 'count' && field.max !== undefined) expect(field.min).toBeLessThan(field.max);
      if (field.type === 'enum') {
        expect(field.options.length).toBeGreaterThan(1);
        const values = field.options.map((o) => o.value);
        expect(new Set(values).size).toBe(values.length);
      }
    }
  });

  it('tem rótulo de episódio', () => {
    expect(condition.episodeLabel.trim()).not.toBe('');
  });
});

describe('registro de doenças', () => {
  it('tem ids únicos', () => {
    const ids = conditions.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('falha para doença desconhecida', () => {
    expect(() => getCondition('nao-existe')).toThrow();
  });
});

describe('formatFieldValue', () => {
  const rcu = getCondition('rcu');
  const field = (key: string) => rcu.fields.find((f) => f.key === key)!;

  it('formata cada tipo', () => {
    expect(formatFieldValue(field('blood'), 'little')).toBe('Pouco');
    expect(formatFieldValue(field('pain'), 4)).toBe('4/10');
    expect(formatFieldValue(field('bowel_count'), 3)).toBe('3');
    expect(formatFieldValue(field('bristol'), null)).toBe('—');
  });
});
