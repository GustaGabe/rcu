import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import type { FieldDefinition } from '@/conditions';
import { colors, fonts, radius, spacing } from '@/theme';

import { Text } from '../Text';
import { Stepper } from './Stepper';
import { TextField } from './TextField';

type Value = number | string | null;

interface FieldInputProps {
  field: FieldDefinition;
  value: Value;
  onChange: (value: Value) => void;
  error?: string;
}

/**
 * Campo do diário editável, no formato do seu tipo: contador, escala em segmentos,
 * opções em chips ou texto. Qualquer doença nova usa estes mesmos quatro formatos.
 */
export function FieldInput({ field, value, onChange, error }: FieldInputProps) {
  return (
    <View style={styles.field}>
      <View style={styles.header}>
        <Text variant="bodyStrong">{field.label}</Text>
        {!field.required && value !== null && value !== '' ? (
          <Pressable onPress={() => onChange(null)} hitSlop={8} accessibilityRole="button">
            <Text variant="label" color={colors.violet}>
              Limpar
            </Text>
          </Pressable>
        ) : (
          !field.required && <Text variant="label">opcional</Text>
        )}
      </View>
      <Input field={field} value={value} onChange={onChange} />
      {error && (
        <Text variant="caption" color={colors.rose}>
          {error}
        </Text>
      )}
    </View>
  );
}

function Input({ field, value, onChange }: Omit<FieldInputProps, 'error'>) {
  switch (field.type) {
    case 'count':
      return (
        <Stepper
          value={typeof value === 'number' ? value : null}
          onChange={onChange}
          min={field.min}
          max={field.max ?? 99}
          accessibilityLabel={field.label}
        />
      );
    case 'scale':
      return (
        <ScaleInput
          label={field.label}
          min={field.min}
          max={field.max}
          value={typeof value === 'number' ? value : null}
          onChange={onChange}
        />
      );
    case 'enum':
      return (
        <View style={styles.chips} accessibilityRole="radiogroup">
          {field.options.map((option) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  Haptics.selectionAsync();
                  onChange(option.value);
                }}
                style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
              >
                <Text color={selected ? colors.onViolet : colors.violet} style={styles.chipLabel}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    case 'text':
      return (
        <TextField
          value={typeof value === 'string' ? value : ''}
          onChangeText={(text) => onChange(text === '' ? null : text)}
          multiline
          maxLength={500}
          accessibilityLabel={field.label}
        />
      );
  }
}

interface ScaleInputProps {
  label: string;
  min: number;
  max: number;
  value: number | null;
  onChange: (value: number) => void;
}

/** Um segmento por valor; tocar escolhe o valor e preenche até ele. */
function ScaleInput({ label, min, max, value, onChange }: ScaleInputProps) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View style={styles.scale}>
      <View style={styles.segments}>
        {steps.map((step) => {
          const filled = value !== null && step <= value;
          return (
            <Pressable
              key={step}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${step}`}
              accessibilityState={{ selected: step === value }}
              hitSlop={{ top: 12, bottom: 12 }}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(step);
              }}
              style={styles.segmentHit}
            >
              <View style={[styles.segment, filled && styles.segmentOn, step === value && styles.segmentCurrent]}>
                <Text style={[styles.segmentLabel, filled && styles.segmentLabelOn]}>{step}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm, paddingVertical: spacing.md },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  pressed: { opacity: 0.75 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.violetSoft,
  },
  chipSelected: { backgroundColor: colors.violet },
  chipLabel: { fontFamily: fonts.bodySemibold, fontSize: 15 },

  scale: { gap: spacing.xs },
  segments: { flexDirection: 'row', gap: 4 },
  segmentHit: { flex: 1 },
  segment: {
    height: 34,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentOn: { backgroundColor: colors.violet },
  segmentCurrent: { transform: [{ scaleY: 1.12 }] },
  segmentLabel: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.inkSoft },
  segmentLabelOn: { color: colors.onViolet },
});
