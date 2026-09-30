import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { Text } from './Text';

interface LargeTitleProps {
  title: string;
  subtitle?: string;
  /** Ação à direita, como o botão de adicionar. */
  accessory?: ReactNode;
}

export function LargeTitle({ title, subtitle, accessory }: LargeTitleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text variant="display">
          {title}
        </Text>
        {subtitle && <Text variant="caption">{subtitle}</Text>}
      </View>
      {accessory}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
  text: { flex: 1, gap: spacing.xs },
});
