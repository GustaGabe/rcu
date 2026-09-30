import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { Text } from './Text';

export function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.row}>
      <Text variant="title" style={styles.title}>
        {title}
      </Text>
      {detail && <Text variant="caption">{detail}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: -spacing.xs,
  },
  title: { fontSize: 20, lineHeight: 24 },
});
