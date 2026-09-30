import { subDays } from 'date-fns';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { LargeTitle } from '@/components/LargeTitle';
import { ListRow } from '@/components/ListRow';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { activeFields, formatFieldValue, getCondition, type FieldDefinition } from '@/conditions';
import { formatWeekdayShort, toDateKey, todayKey } from '@/domain/dates';
import { capitalizeFirst, formatPercent, isDateInEpisode } from '@/domain/format';
import { adherence, diaryEntries, episodes } from '@/mocks/data';
import { colors, fonts, spacing } from '@/theme';

// No MVP só a RCU está ativa; na etapa 3 isto vem de user_conditions.
const condition = getCondition('rcu');
const summaryFields = activeFields(condition).filter((f) => f.required);
const STRIP_DAYS = 14;

// Colunas alinhadas entre as linhas; valores em palavra (enum) pedem mais espaço que números.
const columnWeight: Record<FieldDefinition['type'], number> = { count: 1.1, enum: 1.3, scale: 0.9, text: 1.3 };

export default function DiaryScreen() {
  const today = todayKey();
  const entries = diaryEntries
    .filter((e) => e.conditionId === condition.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const conditionEpisodes = episodes.filter((e) => e.conditionId === condition.id);

  return (
    <Screen tab>
      <LargeTitle title="Diário" subtitle={condition.name} />

      <Surface style={styles.adherence}>
        <View style={styles.flex}>
          <Text variant="heading">Doses tomadas</Text>
          <Text variant="caption">Quanto das doses previstas você marcou como tomadas.</Text>
        </View>
        <AdherenceRing label="7 dias" ratio={adherence.last7} />
        <AdherenceRing label="30 dias" ratio={adherence.last30} />
      </Surface>

      <DayStrip today={today} />

      <SectionHeader title="Registros" detail={`${entries.length} dias`} />
      {entries.length === 0 ? (
        <EmptyState icon="create-outline" message="Nenhum registro ainda. Registre o seu dia na aba Hoje." />
      ) : (
        <Surface padded={false}>
          {entries.map((entry, index) => {
            const inEpisode = isDateInEpisode(entry.date, conditionEpisodes);
            return (
              <ListRow
                key={entry.id}
                first={index === 0}
                accent={inEpisode ? colors.rose : undefined}
                chevron={false}
                accessibilityLabel={`Abrir registro de ${entry.date}`}
                onPress={() => router.push({ pathname: '/diary/[date]', params: { date: entry.date } })}
                leading={
                  <View style={styles.day}>
                    <Text style={[styles.dayNumber, inEpisode && styles.dayEpisode]}>
                      {Number(entry.date.slice(8, 10))}
                    </Text>
                    <Text variant="label" color={inEpisode ? colors.rose : undefined}>
                      {inEpisode ? capitalizeFirst(condition.episodeLabel) : formatWeekdayShort(entry.date)}
                    </Text>
                  </View>
                }
              >
                <View style={styles.metrics}>
                  {summaryFields.map((f) => (
                    <View key={f.key} style={[styles.metric, { flex: columnWeight[f.type] }]}>
                      <Text style={styles.metricValue} numberOfLines={1}>
                        {formatFieldValue(f, entry.values[f.key])}
                      </Text>
                      <Text variant="label" style={styles.metricLabel} numberOfLines={1}>
                        {f.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </ListRow>
            );
          })}
        </Surface>
      )}
    </Screen>
  );
}

function AdherenceRing({ label, ratio }: { label: string; ratio: number }) {
  return (
    <View style={styles.ring}>
      <ProgressRing progress={ratio} size={64} strokeWidth={7} color={colors.violet} trackColor={colors.violetSoft}>
        <Text style={styles.ringValue}>{formatPercent(ratio)}</Text>
      </ProgressRing>
      <Text variant="label">{label}</Text>
    </View>
  );
}

/** Os últimos 14 dias de relance: registrado, em crise ou sem registro. */
function DayStrip({ today }: { today: string }) {
  const days = Array.from({ length: STRIP_DAYS }, (_, i) => toDateKey(subDays(new Date(), STRIP_DAYS - 1 - i)));
  const registered = new Set(diaryEntries.filter((e) => e.conditionId === condition.id).map((e) => e.date));
  const conditionEpisodes = episodes.filter((e) => e.conditionId === condition.id);

  return (
    <Surface>
      <Text variant="heading">Últimos 14 dias</Text>
      <View style={styles.strip}>
        {days.map((day) => {
          const inEpisode = isDateInEpisode(day, conditionEpisodes);
          const hasEntry = registered.has(day);
          return (
            <View key={day} style={styles.stripDay}>
              <Text variant="label" style={styles.stripLabel}>
                {formatWeekdayShort(day).charAt(0)}
              </Text>
              <View
                style={[
                  styles.dot,
                  hasEntry && styles.dotEntry,
                  inEpisode && styles.dotEpisode,
                  day === today && !hasEntry && styles.dotToday,
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Legend color={colors.violet} label="Registrado" />
        <Legend color={colors.rose} label={capitalizeFirst(condition.episodeLabel)} />
        <Legend color={colors.surfaceSunken} label="Sem registro" />
      </View>
    </Surface>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text variant="label">{label}</Text>
    </View>
  );
}

const DOT = 16;

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },

  adherence: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ring: { alignItems: 'center', gap: spacing.xs },
  ringValue: { fontFamily: fonts.displaySemibold, fontSize: 15, color: colors.ink },

  strip: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  stripDay: { alignItems: 'center', gap: 6 },
  stripLabel: { fontSize: 11 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.surfaceSunken },
  dotEntry: { backgroundColor: colors.violet },
  dotEpisode: { backgroundColor: colors.rose },
  dotToday: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.violet },
  legend: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },

  day: { width: 40, alignItems: 'center', justifyContent: 'center' },
  dayNumber: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, color: colors.ink },
  dayEpisode: { color: colors.rose },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  metric: { minWidth: 0, gap: 1 },
  metricValue: { fontFamily: fonts.displaySemibold, fontSize: 16, lineHeight: 20, color: colors.ink },
  metricLabel: { fontSize: 11, lineHeight: 14 },
});
