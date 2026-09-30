import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import type { ConditionDefinition } from '@/conditions';

interface EpisodeIconProps {
  condition: ConditionDefinition;
  /** `true` para episódio em curso ou dia de episódio; `false` para o botão de iniciar. */
  active?: boolean;
  size?: number;
  color: string;
}

/** Símbolo do episódio de piora da doença (na RCU, um rosto de mal-estar para a crise). */
export function EpisodeIcon({ condition, active = true, size = 18, color }: EpisodeIconProps) {
  return (
    <MaterialCommunityIcons
      name={active ? condition.episodeIcon.active : condition.episodeIcon.idle}
      size={size}
      color={color}
    />
  );
}
