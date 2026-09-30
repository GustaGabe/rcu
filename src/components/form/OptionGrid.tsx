import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

import { Text } from '../Text';

export interface Option<T extends string> {
  value: T;
  label: string;
  icon?: (selected: boolean) => ReactNode;
}

interface OptionGridProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: number;
}

/** Escolha única em blocos com ícone, para poucas opções (ex.: forma do remédio). */
export function OptionGrid<T extends string>({ options, value, onChange, columns = 3 }: OptionGridProps<T>) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync();
              onChange(option.value);
            }}
            style={({ pressed }) => [
              styles.option,
              { width: `${100 / columns}%` },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.tile, selected && styles.tileSelected]}>
              {option.icon?.(selected)}
              <Text color={selected ? colors.violet : colors.ink} style={styles.label} numberOfLines={1}>
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  option: { padding: spacing.xs },
  pressed: { opacity: 0.8 },
  tile: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  tileSelected: { backgroundColor: colors.violetSoft, borderColor: colors.violet },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13 },
});
