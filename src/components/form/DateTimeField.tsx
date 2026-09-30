import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { formatDateMedium } from '@/domain/dates';
import { colors, fonts, radius, spacing } from '@/theme';

import { Text } from '../Text';

interface DateTimeFieldProps {
  mode: 'date' | 'time';
  /** `yyyy-MM-dd` no modo data, `HH:mm` no modo hora. */
  value: string;
  onChange: (value: string) => void;
  accessibilityLabel: string;
  minimumDate?: string;
}

function toDate(mode: 'date' | 'time', value: string): Date {
  if (mode === 'date') return parseISO(value);
  const [h, m] = value.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function fromDate(mode: 'date' | 'time', date: Date): string {
  return format(date, mode === 'date' ? 'yyyy-MM-dd' : 'HH:mm');
}

/**
 * Seletor nativo de data ou hora. No iOS, o botão compacto do sistema abre o calendário/relógio;
 * no Android, um campo que abre o diálogo nativo.
 */
export function DateTimeField({ mode, value, onChange, accessibilityLabel, minimumDate }: DateTimeFieldProps) {
  const date = toDate(mode, value);
  const minimum = minimumDate ? parseISO(minimumDate) : undefined;

  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={date}
        mode={mode}
        display="compact"
        locale="pt-BR"
        accentColor={colors.violet}
        themeVariant="light"
        minimumDate={minimum}
        accessibilityLabel={accessibilityLabel}
        onValueChange={(_, next) => onChange(fromDate(mode, next))}
        style={styles.ios}
      />
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() =>
        DateTimePickerAndroid.open({
          value: date,
          mode,
          is24Hour: true,
          minimumDate: minimum,
          onValueChange: (_, next) => onChange(fromDate(mode, next)),
        })
      }
      style={({ pressed }) => [styles.android, pressed && styles.pressed]}
    >
      <Text style={styles.androidValue}>{mode === 'date' ? formatDateMedium(value) : value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ios: { alignSelf: 'flex-start', marginLeft: -spacing.sm },
  android: {
    alignSelf: 'flex-start',
    backgroundColor: colors.violetSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.7 },
  androidValue: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.violet },
});
