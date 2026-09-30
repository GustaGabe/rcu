import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { Text } from './Text';

interface InfoRowProps {
  label: string;
  value: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  first?: boolean;
}

/** Par rótulo/valor dentro de uma `Surface` com padding. */
export function InfoRow({ label, value, icon, first = false }: InfoRowProps) {
  return (
    <View style={[styles.row, !first && styles.divider]}>
      {icon && <Ionicons name={icon} size={18} color={colors.violet} />}
      <Text variant="caption" style={styles.label}>
        {label}
      </Text>
      <Text variant="bodyStrong" style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  label: { flexShrink: 0 },
  value: { flex: 1, textAlign: 'right' },
});
