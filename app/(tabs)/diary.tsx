import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { activeFields, formatFieldValue, getCondition } from '@/conditions';
import { formatDateLong } from '@/domain/dates';
import { formatPercent, isDateInEpisode } from '@/domain/format';
import { adherence, diaryEntries, episodes } from '@/mocks/data';
import { spacing } from '@/theme';

// No MVP só a RCU está ativa; na etapa 3 isto vem de user_conditions.
const condition = getCondition('rcu');
const summaryFields = activeFields(condition).filter((f) => f.required);

export default function DiaryScreen() {
  const entries = [...diaryEntries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen>
      <Card>
        <Text variant="heading">Adesão aos remédios</Text>
        <View style={styles.row}>
          <Text>Últimos 7 dias: {formatPercent(adherence.last7)}</Text>
          <Text>Últimos 30 dias: {formatPercent(adherence.last30)}</Text>
        </View>
      </Card>

      <SectionHeader title="Registros" />
      {entries.length === 0 ? (
        <EmptyState message="Nenhum registro ainda. Registre o seu dia na aba Hoje." />
      ) : (
        entries.map((entry) => {
          const inEpisode = isDateInEpisode(entry.date, episodes);
          return (
            <Card
              key={entry.id}
              highlighted={inEpisode}
              onPress={() => router.push({ pathname: '/diary/[date]', params: { date: entry.date } })}
            >
              <Text variant="heading" style={styles.capitalize}>
                {formatDateLong(entry.date)}
              </Text>
              {inEpisode && <Text variant="caption">Dia de {condition.episodeLabel}</Text>}
              <Text variant="caption">
                {summaryFields
                  .map((f) => `${f.label}: ${formatFieldValue(f, entry.values[f.key])}`)
                  .join(' · ')}
              </Text>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  capitalize: { textTransform: 'capitalize' },
});
