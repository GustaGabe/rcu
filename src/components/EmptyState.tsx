import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Text } from './Text';

interface EmptyStateProps {
  message: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
}

export function EmptyState({ message, icon = 'leaf-outline' }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={22} color={colors.violet} />
      </View>
      <Text variant="caption" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { textAlign: 'center', maxWidth: 300 },
});
