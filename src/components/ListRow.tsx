import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

interface ListRowProps {
  leading?: ReactNode;
  children: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Primeira linha da lista não desenha divisória. */
  first?: boolean;
  /** Faixa colorida à esquerda, para marcar dias de crise. */
  accent?: string;
  /** Seta de navegação em linhas tocáveis. Desligue quando o espaço é disputado. */
  chevron?: boolean;
}

/** Linha de uma lista agrupada dentro de uma `Surface` sem padding. */
export function ListRow({
  leading,
  children,
  trailing,
  onPress,
  accessibilityLabel,
  first = false,
  accent,
  chevron = true,
}: ListRowProps) {
  const content = (
    <>
      {accent && <View style={[styles.accent, { backgroundColor: accent }]} />}
      {leading}
      <View style={[styles.body, !first && styles.divider]}>
        <View style={styles.main}>{children}</View>
        {trailing}
        {onPress && chevron && !trailing && <Ionicons name="chevron-forward" size={18} color={colors.line} />}
      </View>
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', paddingLeft: spacing.lg, gap: spacing.md },
  pressed: { backgroundColor: colors.canvas },
  accent: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingRight: spacing.lg,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  main: { flex: 1, gap: 2 },
});
