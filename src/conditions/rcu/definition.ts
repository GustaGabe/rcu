import type { ConditionDefinition } from '../types';

export const rcu: ConditionDefinition = {
  id: 'rcu',
  name: 'Retocolite ulcerativa',
  episodeLabel: 'crise',
  episodeIcon: { active: 'emoticon-sick', idle: 'emoticon-sick-outline' },
  fields: [
    { key: 'bowel_count', label: 'Evacuações', type: 'count', min: 0, required: true, carryOver: true },
    {
      key: 'blood',
      label: 'Sangue',
      type: 'enum',
      options: [
        { value: 'none', label: 'Nenhum' },
        { value: 'little', label: 'Pouco' },
        { value: 'lots', label: 'Muito' },
      ],
      required: true,
      carryOver: true,
    },
    { key: 'urgency', label: 'Urgência', type: 'scale', min: 0, max: 3, required: true, carryOver: true },
    { key: 'pain', label: 'Dor', type: 'scale', min: 0, max: 10, required: true, carryOver: true },
    { key: 'bristol', label: 'Escala de Bristol', type: 'scale', min: 1, max: 7, carryOver: true },
    { key: 'fatigue', label: 'Cansaço', type: 'scale', min: 0, max: 3, carryOver: true },
  ],
};
