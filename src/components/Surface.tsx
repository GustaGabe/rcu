import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Pressable } from './Pressable';

interface SurfaceProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** `false` para listas, em que cada linha tem o próprio respiro. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Superfície branca sobre o fundo lilás. Sem borda nem sombra: o contraste de tom separa. */
export function Surface({ children, onPress, accessibilityLabel, padded = true, style }: SurfaceProps) {
  const surfaceStyle = [styles.surface, padded && styles.padded, style];

  if (!onPress) return <View style={surfaceStyle}>{children}</View>;

  return (
    <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel} pressedScale={0.985} style={surfaceStyle}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  padded: { padding: spacing.lg, gap: spacing.sm },
});
