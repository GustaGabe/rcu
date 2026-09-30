import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { fonts, radius, spacing, tones, type Tone } from '@/theme';

import { Text } from './Text';

interface ChipProps {
  label: string;
  tone?: Tone;
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Ícone de outro conjunto; recebe a cor do texto. Tem prioridade sobre `icon`. */
  renderIcon?: (color: string) => ReactNode;
  /** Preenchido com a cor do tom (opção selecionada). */
  solid?: boolean;
}

export function Chip({ label, tone = 'neutral', icon, renderIcon, solid = false }: ChipProps) {
  const { fg, bg } = tones[tone];
  const color = solid ? '#FFFFFF' : fg;

  return (
    <View style={[styles.chip, { backgroundColor: solid ? fg : bg }]}>
      {renderIcon ? renderIcon(color) : icon && <Ionicons name={icon} size={13} color={color} />}
      <Text color={color} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 17 },
});
