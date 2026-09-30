import { StyleSheet, Switch, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { Text } from '../Text';

interface SwitchRowProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function SwitchRow({ label, value, onChange }: SwitchRowProps) {
  return (
    <View style={styles.row}>
      <Text variant="bodyStrong" style={styles.label}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ false: colors.surfaceSunken, true: colors.violet }}
        ios_backgroundColor={colors.surfaceSunken}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { flex: 1 },
});
