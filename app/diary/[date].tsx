import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { FieldValue } from '@/components/FieldValue';
import { Screen } from '@/components/Screen';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { activeFields, getCondition } from '@/conditions';
import { formatDayMonth, formatWeekdayLong, isDateKey } from '@/domain/dates';
import { capitalizeFirst, isDateInEpisode } from '@/domain/format';
import { diaryEntries, episodes } from '@/mocks/data';
import { colors, spacing } from '@/theme';

const condition = getCondition('rcu');

export default function DiaryEntryScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();

  if (!isDateKey(date)) {
    return (
      <Screen>
        <EmptyState icon="help-circle-outline" message="Esta data não é válida." />
      </Screen>
    );
  }

  return <DiaryEntryView date={date} />;
}

function DiaryEntryView({ date }: { date: string }) {
  const entries = diaryEntries.filter((e) => e.conditionId === condition.id);
  const entry = entries.find((e) => e.date === date);
  // Sem registro no dia, os valores padrão vêm do registro anterior (D1).
  const previous = entries.filter((e) => e.date < date).sort((a, b) => b.date.localeCompare(a.date))[0];
  const values = entry?.values ?? previous?.values ?? {};

  const conditionEpisodes = episodes.filter((e) => e.conditionId === condition.id);
  const openEpisode = conditionEpisodes.find((e) => e.endDate === null);
  const inEpisode = isDateInEpisode(date, conditionEpisodes);
  const episodeLabel = condition.episodeLabel;

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="bodyStrong" color={colors.violet}>
          {capitalizeFirst(formatWeekdayLong(date))}
        </Text>
        <Text variant="display">{formatDayMonth(date)}</Text>
      </View>
      {inEpisode && <Chip tone="rose" icon="flame" label={`Dia de ${episodeLabel}`} />}
      {!entry && previous && (
        <Text variant="caption">Valores preenchidos com o registro anterior. Ajuste o que mudou.</Text>
      )}

      <Surface style={styles.fields}>
        {activeFields(condition).map((field, index) => (
          <View key={field.key} style={index > 0 && styles.divider}>
            <FieldValue field={field} value={field.carryOver || entry ? values[field.key] : null} />
          </View>
        ))}
      </Surface>

      {entry?.notes && (
        <Surface>
          <Text variant="label">Nota</Text>
          <Text>{entry.notes}</Text>
        </Surface>
      )}

      <Button
        variant="danger"
        icon={openEpisode ? 'checkmark-circle-outline' : 'flame-outline'}
        title={openEpisode ? `${capitalizeFirst(episodeLabel)} encerrou` : `Estou em ${episodeLabel}`}
        disabled
      />
      <Text variant="caption" style={styles.note}>
        Editar o dia e marcar {episodeLabel} chegam na etapa 5.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 2 },
  fields: { paddingVertical: spacing.xs, gap: 0 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  note: { textAlign: 'center' },
});
