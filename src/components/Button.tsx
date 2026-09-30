import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

import { Pressable } from './Pressable';
import { Text } from './Text';

type Variant = 'primary' | 'soft' | 'onPlum' | 'danger';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'md' | 'sm';
  icon?: ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
}

const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.violet, fg: colors.onViolet },
  soft: { bg: colors.violetSoft, fg: colors.violet },
  onPlum: { bg: colors.lavender, fg: colors.plum },
  danger: { bg: colors.surface, fg: colors.rose, border: colors.rose },
};

export function Button({ title, onPress, variant = 'primary', size = 'md', icon, disabled = false }: ButtonProps) {
  const { bg, fg, border } = palette[variant];
  const small = size === 'sm';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        small ? styles.sm : styles.md,
        { backgroundColor: bg },
        border ? { borderColor: border, borderWidth: 1.5 } : null,
        disabled && styles.disabled,
      ]}
    >
      {icon && <Ionicons name={icon} size={small ? 15 : 18} color={fg} />}
      <Text color={fg} style={[styles.label, small && styles.labelSm]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
  },
  md: { paddingVertical: 14, paddingHorizontal: spacing.xl },
  sm: { paddingVertical: 8, paddingHorizontal: 14 },
  disabled: { opacity: 0.4 },
  label: { fontFamily: fonts.bodySemibold, fontSize: 15 },
  labelSm: { fontSize: 14 },
});
