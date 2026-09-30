import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

/** Nome de ícone do conjunto MaterialCommunityIcons. */
export type ConditionIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface BaseField {
  /** Chave permanente: nunca renomeie nem reaproveite. */
  key: string;
  label: string;
  required?: boolean;
  /** Vem preenchido com o valor do registro anterior. */
  carryOver?: boolean;
  /** Campo antigo: não aparece no formulário, mas o histórico continua legível. */
  deprecated?: boolean;
}

export interface CountField extends BaseField {
  type: 'count';
  min: number;
  max?: number;
}

export interface ScaleField extends BaseField {
  type: 'scale';
  min: number;
  max: number;
}

export interface EnumOption {
  value: string;
  label: string;
}

export interface EnumField extends BaseField {
  type: 'enum';
  options: EnumOption[];
}

export interface TextField extends BaseField {
  type: 'text';
}

export type FieldDefinition = CountField | ScaleField | EnumField | TextField;

export interface ConditionDefinition {
  id: string;
  name: string;
  /** Nome do episódio de piora, no singular e minúsculo (ex.: "crise"). */
  episodeLabel: string;
  /** Símbolo do episódio: `active` para dia/episódio em curso, `idle` para o botão de iniciar. */
  episodeIcon: { active: ConditionIconName; idle: ConditionIconName };
  fields: FieldDefinition[];
}
