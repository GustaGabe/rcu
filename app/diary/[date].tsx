import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { FieldValue } from '@/components/FieldValue';
import { Screen } from '@/components/Screen';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { activeFields } from '@/conditions';
import type { Db } from '@/db/types';
import { formatDayMonth, formatWeekdayLong, isDateKey } from '@/domain/dates';
import { capitalizeFirst, isDateInEpisode } from '@/domain/format';
import { useFocusQuery } from '@/hooks/useFocusQuery';
import { getPrimaryCondition } from '@/repositories/conditions';
import { getDiaryEntry, getPreviousDiaryEntry, listEpisodes } from '@/repositories/diary';
import { colors, spacing } from '@/theme';

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
  const load = useCallback(
    async (db: Db) => {
      const condition = await getPrimaryCondition(db);
      const [entry, previous, episodes] = await Promise.all([
        getDiaryEntry(db, condition.id, date),
        getPreviousDiaryEntry(db, condition.id, date),
        listEpisodes(db, condition.id),
      ]);
      return { condition, entry, previous, episodes };
    },
    [date],
  );
  const { data } = useFocusQuery(load);
  if (!data) return <Screen>{null}</Screen>;

  const { condition, entry, previous, episodes: conditionEpisodes } = data;
  // Sem registro no dia, os valores padrão vêm do registro anterior (D1).
  const values = entry?.values ?? previous?.values ?? {};
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
