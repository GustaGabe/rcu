import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';

import { Text } from '../Text';

interface StepperProps {
  value: number;
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

  return (
    <View
      style={styles.stepper}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ now: value, min, max }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => change(e.nativeEvent.actionName === 'increment' ? value + 1 : value - 1)}
    >
      <StepButton icon="remove" disabled={value <= min} onPress={() => change(value - 1)} />
      <Text style={styles.value}>{value}</Text>
      <StepButton icon="add" disabled={value >= max} onPress={() => change(value + 1)} />
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
