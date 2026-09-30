import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  /** Destaque de dia em crise. */
  highlighted?: boolean;
}

export function Card({ children, onPress, highlighted = false }: CardProps) {
  const style = [styles.card, highlighted && styles.highlighted];

  if (!onPress) return <View style={style}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  highlighted: { backgroundColor: colors.flare, borderColor: colors.danger },
  pressed: { opacity: 0.7 },
});
