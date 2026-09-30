import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { InfoRow } from '@/components/InfoRow';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { activeFields, formatFieldValue, getCondition } from '@/conditions';
import { formatDateLong, isDateKey } from '@/domain/dates';
import { diaryEntries, episodes } from '@/mocks/data';

const condition = getCondition('rcu');

export default function DiaryEntryScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();

  if (!isDateKey(date)) {
    return (
      <Screen>
        <EmptyState message="Data inválida." />
      </Screen>
    );
  }

  return <DiaryEntryView date={date} />;
}

function DiaryEntryView({ date }: { date: string }) {
  const entry = diaryEntries.find((e) => e.conditionId === condition.id && e.date === date);
  // Sem registro no dia, os valores padrão vêm do registro anterior (D1).
  const previous = [...diaryEntries]
    .filter((e) => e.conditionId === condition.id && e.date < date)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const values = entry?.values ?? previous?.values ?? {};

  const openEpisode = episodes.find((e) => e.conditionId === condition.id && e.endDate === null);
  const episodeLabel = condition.episodeLabel;

  return (
    <Screen>
      <Text variant="title" style={styles.capitalize}>
        {formatDateLong(date)}
      </Text>
      {!entry && previous && <Text variant="caption">Valores preenchidos com o registro anterior.</Text>}

      <Card>
        {activeFields(condition).map((field) => (
          <InfoRow
            key={field.key}
            label={field.required ? field.label : `${field.label} (opcional)`}
            value={formatFieldValue(field, field.carryOver || entry ? values[field.key] : null)}
          />
        ))}
      </Card>

      {entry?.notes && (
        <>
          <SectionHeader title="Nota" />
          <Card>
            <Text>{entry.notes}</Text>
          </Card>
        </>
      )}

      <EmptyState message="O formulário do dia chega na etapa 5." />

      <Button
        variant="secondary"
        title={openEpisode ? `${capitalize(episodeLabel)} encerrou` : `Estou em ${episodeLabel}`}
        disabled
      />
    </Screen>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const styles = StyleSheet.create({
  capitalize: { textTransform: 'capitalize' },
});
