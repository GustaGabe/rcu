import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { Text } from '../Text';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/** Rótulo, controle e, embaixo, o erro (ou uma dica quando não há erro). */
export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <View style={styles.field}>
      {label && <Text variant="bodyStrong">{label}</Text>}
      {children}
      {error ? (
        <Text variant="caption" color={colors.rose}>
          {error}
        </Text>
      ) : (
        hint && <Text variant="caption">{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
});
