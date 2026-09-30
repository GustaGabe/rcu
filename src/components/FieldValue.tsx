import { StyleSheet, View } from 'react-native';

import type { FieldDefinition } from '@/conditions';
import { colors, fonts, radius, spacing } from '@/theme';

import { Chip } from './Chip';
import { Text } from './Text';

interface FieldValueProps {
  field: FieldDefinition;
  value: number | string | null | undefined;
}

/**
 * Mostra o valor de um campo do diário no formato do seu tipo.
 * Na etapa 5 cada formato ganha a versão editável, com o mesmo desenho.
 */
export function FieldValue({ field, value }: FieldValueProps) {
  const empty = value === null || value === undefined || value === '';

  return (
    <View style={styles.field}>
      <View style={styles.header}>
        <Text variant="bodyStrong">{field.label}</Text>
        {!field.required && <Text variant="label">opcional</Text>}
      </View>
      {empty ? <Text variant="caption">Sem registro</Text> : <Value field={field} value={value} />}
    </View>
  );
}

function Value({ field, value }: { field: FieldDefinition; value: number | string }) {
  switch (field.type) {
    case 'count':
      return <Text style={styles.count}>{value}</Text>;
    case 'scale':
      return <ScaleValue min={field.min} max={field.max} value={Number(value)} />;
    case 'enum':
      return (
        <View style={styles.chips}>
          {field.options.map((o) => (
            <Chip key={o.value} label={o.label} tone="violet" solid={o.value === value} />
          ))}
        </View>
      );
    case 'text':
      return <Text>{String(value)}</Text>;
  }
}

/** Escala em segmentos: um por ponto acima do mínimo, preenchidos até o valor. */
function ScaleValue({ min, max, value }: { min: number; max: number; value: number }) {
  const steps = Array.from({ length: max - min }, (_, i) => min + 1 + i);

  return (
    <View style={styles.scale}>
      <View style={styles.segments}>
        {steps.map((step) => (
          <View key={step} style={[styles.segment, step <= value && styles.segmentOn]} />
        ))}
      </View>
      <Text style={styles.scaleValue}>
        {value}
        <Text variant="caption"> / {max}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm, paddingVertical: spacing.md },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  count: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  scale: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  segments: { flex: 1, flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: 10, borderRadius: radius.pill, backgroundColor: colors.surfaceSunken },
  segmentOn: { backgroundColor: colors.violet },
  scaleValue: { fontFamily: fonts.displaySemibold, fontSize: 18, minWidth: 48, textAlign: 'right', color: colors.ink },
});
