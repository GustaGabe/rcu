import { z } from 'zod';

import { activeFields, type ConditionDefinition, type FieldDefinition } from '@/conditions';

import type { DiaryValues } from './types';

export interface DiaryFormValues {
  values: DiaryValues;
  notes: string;
}

const REQUIRED = 'Escolha um valor.';

function fieldSchema(field: FieldDefinition): z.ZodType<number | string | null> {
  switch (field.type) {
    case 'count': {
      let schema = z.number({ error: REQUIRED }).int().min(field.min, `Mínimo de ${field.min}.`);
      if (field.max !== undefined) schema = schema.max(field.max, `Máximo de ${field.max}.`);
      return field.required ? schema : schema.nullable();
    }
    case 'scale': {
      const schema = z
        .number({ error: REQUIRED })
        .int()
        .min(field.min, `Entre ${field.min} e ${field.max}.`)
        .max(field.max, `Entre ${field.min} e ${field.max}.`);
      return field.required ? schema : schema.nullable();
    }
    case 'enum': {
      const values = field.options.map((o) => o.value) as [string, ...string[]];
      const schema = z.enum(values, { error: 'Escolha uma opção.' });
      return field.required ? schema : schema.nullable();
    }
    case 'text': {
      const schema = z.string({ error: REQUIRED }).trim().max(500, 'Use até 500 caracteres.');
      return field.required ? schema.min(1, REQUIRED) : schema.nullable();
    }
  }
}

/** Validação do registro do dia (D1), gerada a partir dos campos ativos da doença. */
export function buildDiarySchema(condition: ConditionDefinition) {
  const shape: Record<string, z.ZodType<number | string | null>> = {};
  for (const field of activeFields(condition)) shape[field.key] = fieldSchema(field);

  return z.object({
    values: z.object(shape),
    notes: z.string().trim().max(1000, 'Use até 1000 caracteres.'),
  });
}

/**
 * Valores iniciais do formulário: o registro do próprio dia, se existir;
 * senão, os campos com `carryOver` vêm do registro anterior e o resto começa vazio.
 */
export function initialDiaryValues(
  condition: ConditionDefinition,
  entry: { values: DiaryValues; notes: string | null } | null,
  previous: { values: DiaryValues } | null,
): DiaryFormValues {
  const values: DiaryValues = {};
  for (const field of activeFields(condition)) {
    if (entry) values[field.key] = entry.values[field.key] ?? null;
    else values[field.key] = field.carryOver && previous ? (previous.values[field.key] ?? null) : null;
  }
  return { values, notes: entry?.notes ?? '' };
}

/**
 * Valores a gravar. Chaves de campos aposentados (`deprecated`) que já estavam no
 * registro são mantidas, para o histórico continuar legível.
 */
export function valuesToSave(existing: DiaryValues | null, form: DiaryFormValues): DiaryValues {
  return { ...(existing ?? {}), ...form.values };
}
