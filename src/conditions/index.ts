import { rcu } from './rcu/definition';
import type { ConditionDefinition, FieldDefinition } from './types';

export type { ConditionDefinition, FieldDefinition } from './types';

/** Doenças disponíveis no app. Para adicionar uma, crie a pasta dela e registre aqui. */
export const conditions: ConditionDefinition[] = [rcu];

export function getCondition(id: string): ConditionDefinition {
  const condition = conditions.find((c) => c.id === id);
  if (!condition) throw new Error(`Doença não registrada: ${id}`);
  return condition;
}

export function activeFields(condition: ConditionDefinition): FieldDefinition[] {
  return condition.fields.filter((f) => !f.deprecated);
}

export function formatFieldValue(field: FieldDefinition, value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  switch (field.type) {
    case 'enum':
      return field.options.find((o) => o.value === value)?.label ?? String(value);
    case 'scale':
      return `${value}/${field.max}`;
    default:
      return String(value);
  }
}
