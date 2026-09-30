import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { DateTile } from '@/components/DateTile';
import { EmptyState } from '@/components/EmptyState';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { activeFields, formatFieldValue } from '@/conditions';
import { useDb } from '@/db/client';
import { clearAllData, loadExampleData } from '@/db/devData';
import type { Db } from '@/db/types';
import {
  formatDateShort,
  formatDayMonth,
  formatRelativeDays,
  formatTime,
  formatWeekdayLong,
  toDateTimeKey,
  todayKey,
} from '@/domain/dates';
import { capitalizeFirst } from '@/domain/format';
import { appointmentTypeLabels } from '@/domain/labels';
import type { ScheduledDose } from '@/domain/types';
import { useFocusQuery } from '@/hooks/useFocusQuery';
import { countOpenQuestions, getNextAppointment } from '@/repositories/appointments';
import { getPrimaryCondition } from '@/repositories/conditions';
import { getDiaryEntry, listEpisodes } from '@/repositories/diary';
import { clearDoseLog, getDosesForDate, logDose } from '@/repositories/doses';
import { colors, fonts, radius, spacing } from '@/theme';

async function loadToday(db: Db) {
  const today = todayKey();
  const condition = await getPrimaryCondition(db);
  const [doses, entry, episodes, nextAppointment, openQuestions] = await Promise.all([
    getDosesForDate(db, today),
    getDiaryEntry(db, condition.id, today),
    listEpisodes(db, condition.id),
    getNextAppointment(db, toDateTimeKey(new Date())),
    countOpenQuestions(db),
  ]);
  return {
    today,
    condition,
    doses,
    entry,
    openEpisode: episodes.find((e) => e.endDate === null) ?? null,
    nextAppointment,
    nextQuestions: nextAppointment ? (openQuestions[nextAppointment.id] ?? 0) : 0,
  };
}

export default function TodayScreen() {
  const db = useDb();
  const { data, reload } = useFocusQuery(loadToday);

  if (!data) return <Screen tab>{null}</Screen>;
  const { today, condition, doses, entry: todayEntry, openEpisode, nextAppointment, nextQuestions } = data;

  async function markTaken(dose: ScheduledDose) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logDose(db, {
      scheduleId: dose.scheduleId,
      scheduledFor: dose.scheduledFor,
      status: 'taken',
      takenAt: toDateTimeKey(new Date()),
    });
    reload();
  }

  // Toque longo numa dose: pular, ou desfazer uma marcação feita por engano.
  function openDoseMenu(dose: ScheduledDose) {
    const title = `${dose.medicationName} às ${formatTime(dose.scheduledFor)}`;
    if (dose.status === 'pending') {
      Alert.alert(title, 'Marcar esta dose como pulada? Ela conta como não tomada na adesão.', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pular dose',
          onPress: async () => {
            await logDose(db, { scheduleId: dose.scheduleId, scheduledFor: dose.scheduledFor, status: 'skipped', takenAt: null });
            reload();
          },
        },
      ]);
      return;
    }
    Alert.alert(title, dose.status === 'taken' ? 'Desmarcar a dose como tomada?' : 'Desmarcar a dose como pulada?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desmarcar',
        style: 'destructive',
        onPress: async () => {
          await clearDoseLog(db, dose.scheduleId, dose.scheduledFor);
          reload();
        },
      },
    ]);
  }

  // Só em desenvolvimento: toque longo no painel troca os dados por um exemplo ou apaga tudo.
  function openDevMenu() {
    Alert.alert('Dados de desenvolvimento', 'Este menu só existe no modo de desenvolvimento.', [
      {
        text: 'Carregar exemplo',
        onPress: async () => {
          await loadExampleData(db);
          reload();
        },
      },
      {
        text: 'Apagar tudo',
        style: 'destructive',
        onPress: async () => {
          await clearAllData(db);
          reload();
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <Screen tab>
      <Hero date={today} doses={doses} onLongPress={__DEV__ ? openDevMenu : undefined} />

      <SectionHeader title="Doses de hoje" />
      {doses.length === 0 ? (
        <EmptyState icon="checkmark-done-outline" message="Cadastre seus remédios na aba Remédios e as doses de cada dia aparecem aqui, nos horários certos." />
      ) : (
        <Surface padded={false} style={styles.timeline}>
          {doses.map((dose, index) => (
            <DoseRow
              key={`${dose.scheduleId}@${dose.scheduledFor}`}
              dose={dose}
              first={index === 0}
              last={index === doses.length - 1}
              onTake={() => markTaken(dose)}
              onLongPress={() => openDoseMenu(dose)}
            />
          ))}
        </Surface>
      )}

      <SectionHeader title="Como você está" />
      {openEpisode && (
        <View style={styles.episode}>
          <Ionicons name="flame" size={18} color={colors.rose} />
          <Text color={colors.rose} variant="bodyStrong" style={styles.flex}>
            Em {condition.episodeLabel} desde {formatDateShort(openEpisode.startDate)}
          </Text>
        </View>
      )}
      <Surface>
        {todayEntry ? (
          <>
            <Text variant="heading">Dia registrado</Text>
            <View style={styles.chips}>
              {activeFields(condition)
                .filter((f) => f.required)
                .map((f) => (
                  <Chip key={f.key} label={`${f.label}: ${formatFieldValue(f, todayEntry.values[f.key])}`} />
                ))}
            </View>
            <Button
              title="Editar registro"
              variant="soft"
              onPress={() => router.push({ pathname: '/diary/[date]', params: { date: today } })}
            />
          </>
        ) : (
          <>
            <View style={styles.prompt}>
              <View style={styles.promptIcon}>
                <Ionicons name="create-outline" size={22} color={colors.violet} />
              </View>
              <View style={styles.flex}>
                <Text variant="heading">Registre o seu dia</Text>
                <Text variant="caption">Evacuações, dor e cansaço em menos de 30 segundos.</Text>
              </View>
            </View>
            <Button
              title="Registrar o dia"
              onPress={() => router.push({ pathname: '/diary/[date]', params: { date: today } })}
            />
          </>
        )}
      </Surface>

      <SectionHeader title="Próxima consulta" />
      {nextAppointment ? (
        <Surface
          accessibilityLabel="Abrir próxima consulta"
          onPress={() => router.push({ pathname: '/appointments/[id]', params: { id: String(nextAppointment.id) } })}
          style={styles.appointment}
        >
          <DateTile date={nextAppointment.datetime} highlighted />
          <View style={styles.flex}>
            <Text variant="heading">{appointmentTypeLabels[nextAppointment.type]}</Text>
            <Text variant="caption">
              {capitalizeFirst(formatRelativeDays(nextAppointment.datetime))}, às {formatTime(nextAppointment.datetime)}
            </Text>
            {nextQuestions > 0 && (
              <View style={styles.appointmentChip}>
                <Chip
                  tone="violet"
                  icon="chatbubble-ellipses-outline"
                  label={nextQuestions === 1 ? '1 pergunta anotada' : `${nextQuestions} perguntas anotadas`}
                />
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.line} />
        </Surface>
      ) : (
        <EmptyState icon="calendar-clear-outline" message="Nenhuma consulta agendada." />
      )}
    </Screen>
  );
}

/** Painel do topo: a data e o progresso das doses do dia. */
function Hero({ date, doses, onLongPress }: { date: string; doses: ScheduledDose[]; onLongPress?: () => void }) {
  const taken = doses.filter((d) => d.status === 'taken').length;
  const next = doses
    .filter((d) => d.status === 'pending')
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))[0];

  return (
    <Pressable onLongPress={onLongPress} delayLongPress={600} style={styles.hero}>
      <Text color={colors.lavender} variant="bodyStrong">
        {capitalizeFirst(formatWeekdayLong(date))}
      </Text>
      <Text variant="display" color={colors.onPlum}>
        {formatDayMonth(date)}
      </Text>

      <View style={styles.heroRow}>
        <ProgressRing
          progress={doses.length ? taken / doses.length : 0}
          color={colors.lavender}
          trackColor={colors.plumRaised}
        >
          <Text color={colors.onPlum} style={styles.ringValue}>
            {taken}/{doses.length}
          </Text>
          <Text color={colors.onPlumSoft} variant="label">
            doses
          </Text>
        </ProgressRing>

        <View style={styles.flex}>
          {next ? (
            <>
              <Text color={colors.lavender} variant="label">
                Próxima dose
              </Text>
              <Text color={colors.onPlum} style={styles.nextTime}>
                {formatTime(next.scheduledFor)}
              </Text>
              <Text color={colors.onPlumSoft} numberOfLines={1}>
                {next.medicationName}
              </Text>
            </>
          ) : doses.length === 0 ? (
            <Text color={colors.onPlumSoft}>Nenhuma dose prevista para hoje.</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={28} color={colors.lavender} />
              <Text color={colors.onPlum} variant="heading">
                {taken === doses.length ? 'Todas as doses de hoje foram tomadas' : 'Todas as doses de hoje foram marcadas'}
              </Text>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

interface DoseRowProps {
  dose: ScheduledDose;
  first: boolean;
  last: boolean;
  onTake: () => void;
  onLongPress: () => void;
}

/** Uma dose na linha do tempo do dia: horário, trilho com o marcador e ação. */
function DoseRow({ dose, first, last, onTake, onLongPress }: DoseRowProps) {
  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={450}
      accessibilityHint="Toque longo para pular ou desmarcar"
      style={({ pressed }) => [styles.doseRow, pressed && styles.doseRowPressed]}
    >
      <Text style={[styles.doseTime, dose.status === 'taken' && styles.doseTimeDone]}>
        {formatTime(dose.scheduledFor)}
      </Text>

      <View style={styles.rail}>
        <View style={[styles.railLine, first && styles.railLineFirst, last && styles.railLineLast]} />
        <Animated.View key={dose.status} entering={ZoomIn.springify().damping(12)}>
          <DoseNode status={dose.status} />
        </Animated.View>
      </View>

      <View style={[styles.doseBody, !first && styles.doseDivider]}>
        <View style={styles.flex}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {dose.medicationName}
          </Text>
          <Text variant="caption" numberOfLines={2}>
            {dose.dose}
          </Text>
        </View>
        {dose.status === 'pending' && <Button title="Tomei" size="sm" variant="soft" onPress={onTake} />}
        {dose.status === 'taken' && dose.takenAt && (
          <Chip tone="sage" icon="checkmark" label={`às ${formatTime(dose.takenAt)}`} />
        )}
        {dose.status === 'skipped' && <Chip tone="amber" label="Pulada" />}
      </View>
    </Pressable>
  );
}

function DoseNode({ status }: { status: ScheduledDose['status'] }) {
  if (status === 'taken') {
    return (
      <View style={[styles.node, styles.nodeTaken]}>
        <Ionicons name="checkmark" size={12} color={colors.onPlum} />
      </View>
    );
  }
  if (status === 'skipped') {
    return (
      <View style={[styles.node, styles.nodeSkipped]}>
        <Ionicons name="remove" size={12} color={colors.onPlum} />
      </View>
    );
  }
  return <View style={[styles.node, styles.nodePending]} />;
}

const NODE = 20;

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },

  hero: {
    backgroundColor: colors.plum,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: 2,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginTop: spacing.xl },
  ringValue: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26 },
  nextTime: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, letterSpacing: -1 },

  timeline: { paddingVertical: spacing.xs },
  doseRow: { flexDirection: 'row', alignItems: 'stretch', paddingLeft: spacing.lg },
  doseRowPressed: { backgroundColor: colors.canvas },
  doseTime: {
    width: 48,
    alignSelf: 'center',
    fontFamily: fonts.displaySemibold,
    fontSize: 16,
    color: colors.ink,
  },
  doseTimeDone: { color: colors.inkSoft },
  rail: { width: NODE + 12, alignItems: 'center', justifyContent: 'center' },
  railLine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.line },
  railLineFirst: { top: '50%' },
  railLineLast: { bottom: '50%' },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeTaken: { backgroundColor: colors.sage },
  nodeSkipped: { backgroundColor: colors.amber },
  nodePending: { backgroundColor: colors.surface, borderWidth: 2.5, borderColor: colors.violet },
  doseBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingLeft: spacing.sm,
    paddingRight: spacing.lg,
  },
  doseDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },

  episode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.roseSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  prompt: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  promptIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },

  appointment: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  appointmentChip: { marginTop: spacing.sm },
});
