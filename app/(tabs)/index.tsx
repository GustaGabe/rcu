import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { DateTile } from '@/components/DateTile';
import { EmptyState } from '@/components/EmptyState';
import { EpisodeIcon } from '@/components/EpisodeIcon';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { activeFields, formatFieldValue } from '@/conditions';
import { useDb } from '@/db/client';
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
import {
  askForRemindersIfNeeded,
  getPermissionState,
  rescheduleAll,
  type PermissionState,
} from '@/notifications/scheduler';
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
  const [permission, setPermission] = useState<PermissionState>('granted');

  useFocusEffect(
    useCallback(() => {
      getPermissionState().then(setPermission);
    }, []),
  );

  if (!data) return <Screen tab>{null}</Screen>;
  const { today, condition, doses, entry: todayEntry, openEpisode, nextAppointment, nextQuestions } = data;

  // Toda gravação reagenda os lembretes: uma dose marcada não deve mais tocar.
  async function afterWrite() {
    await rescheduleAll(db);
    reload();
  }

  async function enableReminders() {
    const state = await askForRemindersIfNeeded();
    setPermission(state);
    if (state === 'granted') await rescheduleAll(db);
  }

  async function markTaken(dose: ScheduledDose) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logDose(db, {
      scheduleId: dose.scheduleId,
      scheduledFor: dose.scheduledFor,
      status: 'taken',
      takenAt: toDateTimeKey(new Date()),
    });
    afterWrite();
  }

  // Toque longo numa dose: pular, ou desfazer uma marcação feita por engano.
  // Marcou sem querer: um toque no selo devolve a dose para pendente.
  async function undoMark(dose: ScheduledDose) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await clearDoseLog(db, dose.scheduleId, dose.scheduledFor);
    afterWrite();
  }

  function openDoseMenu(dose: ScheduledDose) {
    const title = `${dose.medicationName} às ${formatTime(dose.scheduledFor)}`;
    if (dose.status === 'pending') {
      Alert.alert(title, 'Marcar esta dose como pulada? Ela conta como não tomada na adesão.', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pular dose',
          onPress: async () => {
            await logDose(db, { scheduleId: dose.scheduleId, scheduledFor: dose.scheduledFor, status: 'skipped', takenAt: null });
            afterWrite();
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
          afterWrite();
        },
      },
    ]);
  }

  return (
    <Screen tab>
      <Hero date={today} doses={doses} />

      {doses.length > 0 && permission !== 'granted' && (
        <View style={styles.remindersOff}>
          <Ionicons name="notifications-off" size={20} color={colors.amber} />
          <View style={styles.flex}>
            <Text variant="bodyStrong">Lembretes desligados</Text>
            <Text variant="caption">
              {permission === 'denied'
                ? 'O app não pode avisar na hora das doses. Ative as notificações do App RCU nos Ajustes do iPhone.'
                : 'Ative para ser avisado na hora de cada dose e antes das consultas.'}
            </Text>
          </View>
          <Button
            title={permission === 'denied' ? 'Ajustes' : 'Ativar'}
            size="sm"
            variant="soft"
            onPress={permission === 'denied' ? () => Linking.openSettings() : enableReminders}
          />
        </View>
      )}

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
              onUndo={() => undoMark(dose)}
              onLongPress={() => openDoseMenu(dose)}
            />
          ))}
        </Surface>
      )}

      <SectionHeader title="Como você está" />
      {openEpisode && (
        <View style={styles.episode}>
          <EpisodeIcon condition={condition} size={20} color={colors.rose} />
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
function Hero({ date, doses }: { date: string; doses: ScheduledDose[] }) {
  const taken = doses.filter((d) => d.status === 'taken').length;
  const next = doses
    .filter((d) => d.status === 'pending')
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))[0];

  return (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <Text color={colors.lavender} variant="bodyStrong">
          {capitalizeFirst(formatWeekdayLong(date))}
        </Text>
        <Pressable
          onPress={() => router.push('/about')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Sobre o app e ajustes"
        >
          <Ionicons name="information-circle-outline" size={26} color={colors.lavenderMuted} />
        </Pressable>
      </View>
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
    </View>
  );
}

interface DoseRowProps {
  dose: ScheduledDose;
  first: boolean;
  last: boolean;
  onTake: () => void;
  onUndo: () => void;
  onLongPress: () => void;
}

/** Uma dose na linha do tempo do dia: horário, trilho com o marcador e ação. */
function DoseRow({ dose, first, last, onTake, onUndo, onLongPress }: DoseRowProps) {
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
        {dose.status !== 'pending' && (
          <MarkedBadge
            taken={dose.status === 'taken'}
            label={dose.status === 'taken' && dose.takenAt ? `às ${formatTime(dose.takenAt)}` : dose.status === 'taken' ? 'Tomada' : 'Pulada'}
            onUndo={onUndo}
          />
        )}
      </View>
    </Pressable>
  );
}

/** Selo da dose marcada. Tocar desfaz a marcação; o ícone de desfazer deixa isso visível. */
function MarkedBadge({ taken, label, onUndo }: { taken: boolean; label: string; onUndo: () => void }) {
  const tone = taken ? { fg: colors.sage, bg: colors.sageSoft } : { fg: colors.amber, bg: colors.amberSoft };
  return (
    <Pressable
      onPress={onUndo}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${taken ? 'Tomada' : 'Pulada'} ${label}. Toque para desmarcar.`}
      style={({ pressed }) => [styles.badge, { backgroundColor: tone.bg }, pressed && styles.badgePressed]}
    >
      <Ionicons name={taken ? 'checkmark' : 'remove'} size={14} color={tone.fg} />
      <Text color={tone.fg} style={styles.badgeLabel}>
        {label}
      </Text>
      <View style={[styles.badgeDivider, { backgroundColor: tone.fg }]} />
      <Ionicons name="arrow-undo" size={13} color={tone.fg} />
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
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  badgePressed: { opacity: 0.6 },
  badgeLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 17 },
  badgeDivider: { width: StyleSheet.hairlineWidth, height: 12, opacity: 0.5, marginHorizontal: 1 },
  doseDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },

  remindersOff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
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
