import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MedicationForm } from '@/domain/types';
import { tones, type Tone } from '@/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const medicationFormIcons: Record<MedicationForm, { icon: IconName; tone: Tone }> = {
  tablet: { icon: 'pill', tone: 'violet' },
  suppository: { icon: 'medication', tone: 'violet' },
  enema: { icon: 'water-outline', tone: 'sage' },
  injection: { icon: 'needle', tone: 'amber' },
  infusion: { icon: 'iv-bag', tone: 'rose' },
  other: { icon: 'bottle-tonic-plus-outline', tone: 'neutral' },
};

interface IconBadgeProps {
  form: MedicationForm;
  size?: number;
  /** Remédio pausado ou arquivado: ícone em tom neutro. */
  muted?: boolean;
}

/** Quadrado arredondado com o ícone da forma do remédio. */
export function IconBadge({ form, size = 44, muted = false }: IconBadgeProps) {
  const { icon, tone } = medicationFormIcons[form];
  const { fg, bg } = tones[muted ? 'neutral' : tone];

  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon} size={size * 0.5} color={fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
});
