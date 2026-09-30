import { StyleSheet, Text } from 'react-native';

import { spacing, typography } from '@/theme';

export function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: { ...typography.heading, marginTop: spacing.md },
});
