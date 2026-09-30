import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';

import { Text } from '../Text';

interface StepperProps {
  /** `null` mostra "—"; o primeiro toque define um valor. */
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  accessibilityLabel: string;
}

/** Número com botões de menos e mais. */
export function Stepper({ value, onChange, min = 1, max = 365, accessibilityLabel }: StepperProps) {
  function change(next: number) {
    if (next < min || next > max) return;
    Haptics.selectionAsync();
    onChange(next);
  }
  const increment = () => change(value === null ? Math.min(min + 1, max) : value + 1);
  const decrement = () => change(value === null ? min : value - 1);

  return (
    <View
      style={styles.stepper}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={value === null ? { text: 'sem valor' } : { now: value, min, max }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'increment' ? increment() : decrement())}
    >
      <StepButton icon="remove" disabled={value !== null && value <= min} onPress={decrement} />
      <Text style={styles.value}>{value ?? '—'}</Text>
      <StepButton icon="add" disabled={value !== null && value >= max} onPress={increment} />
    </View>
  );
}

function StepButton({ icon, disabled, onPress }: { icon: 'add' | 'remove'; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={20} color={colors.violet} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.35 },
  value: { fontFamily: fonts.display, fontSize: 22, minWidth: 56, textAlign: 'center', color: colors.ink },
});
