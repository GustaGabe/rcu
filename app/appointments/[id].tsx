import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Chip } from '@/components/Chip';
import { DateTile } from '@/components/DateTile';
import { EmptyState } from '@/components/EmptyState';
import { InfoRow } from '@/components/InfoRow';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { formatRelativeDays, formatTime, formatWeekdayLong, toDateTimeKey } from '@/domain/dates';
import { capitalizeFirst } from '@/domain/format';
import { appointmentTypeLabels } from '@/domain/labels';
import type { DoctorQuestion } from '@/domain/types';
import { appointments, doctorQuestions } from '@/mocks/data';
import { colors, radius, spacing } from '@/theme';

export default function AppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointment = appointments.find((a) => String(a.id) === id);
  const [questions, setQuestions] = useState<DoctorQuestion[]>(() =>
    doctorQuestions.filter((q) => String(q.appointmentId) === id),
  );

  if (!appointment) {
    return (
      <Screen>
        <EmptyState icon="help-circle-outline" message="Esta consulta não existe mais." />
      </Screen>
    );
  }

  const upcoming = appointment.datetime >= toDateTimeKey(new Date());
  const asked = questions.filter((q) => q.asked).length;

  // Estado só em memória por enquanto; na etapa 6 grava em doctor_questions.
  function toggleAsked(questionId: number) {
    Haptics.selectionAsync();
    setQuestions((current) => current.map((q) => (q.id === questionId ? { ...q, asked: !q.asked } : q)));
  }

  return (
    <Screen>
      <View style={styles.header}>
        <DateTile date={appointment.datetime} highlighted={upcoming} size="lg" />
        <View style={styles.flex}>
          <Text variant="title">{appointmentTypeLabels[appointment.type]}</Text>
          <Text variant="caption">
            {capitalizeFirst(formatWeekdayLong(appointment.datetime))}, às {formatTime(appointment.datetime)}
          </Text>
          <View style={styles.relative}>
            <Chip tone={upcoming ? 'violet' : 'neutral'} label={capitalizeFirst(formatRelativeDays(appointment.datetime))} />
          </View>
        </View>
      </View>

      <Surface style={styles.details}>
        <InfoRow first icon="person-outline" label="Profissional" value={appointment.professional ?? 'Não informado'} />
        <InfoRow icon="location-outline" label="Local" value={appointment.location ?? 'Não informado'} />
      </Surface>

      {appointment.notes && (
        <Surface>
          <Text variant="label">Observações</Text>
          <Text>{appointment.notes}</Text>
        </Surface>
      )}

      <SectionHeader title="Lembretes" />
      <View style={styles.reminders}>
        <Reminder label="1 dia antes" on={appointment.remind1d} />
        <Reminder label="2 horas antes" on={appointment.remind2h} />
      </View>

      <SectionHeader
        title="Perguntas para o médico"
        detail={questions.length > 0 ? `${asked} de ${questions.length}` : undefined}
      />
      {questions.length === 0 ? (
        <EmptyState icon="chatbubble-ellipses-outline" message="Anote aqui as dúvidas que surgirem até a consulta." />
      ) : (
        <Surface padded={false}>
          {questions.map((q, index) => (
            <Pressable
              key={q.id}
              onPress={() => toggleAsked(q.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: q.asked }}
              style={({ pressed }) => [styles.question, index > 0 && styles.divider, pressed && styles.pressed]}
            >
              <View style={[styles.check, q.asked && styles.checkOn]}>
                {q.asked && (
                  <Animated.View entering={ZoomIn.springify().damping(12)}>
                    <Ionicons name="checkmark" size={16} color={colors.onPlum} />
                  </Animated.View>
                )}
              </View>
              <View style={styles.flex}>
                <Text color={q.asked ? colors.inkSoft : colors.ink}>{q.question}</Text>
                {q.answer && <Text variant="caption">{q.answer}</Text>}
              </View>
            </Pressable>
          ))}
        </Surface>
      )}
    </Screen>
  );
}

function Reminder({ label, on }: { label: string; on: boolean }) {
  return (
    <View style={[styles.reminder, on && styles.reminderOn]}>
      <Ionicons
        name={on ? 'notifications' : 'notifications-off-outline'}
        size={18}
        color={on ? colors.violet : colors.inkSoft}
      />
      <Text variant="bodyStrong" color={on ? colors.ink : colors.inkSoft}>
        {label}
      </Text>
    </View>
  );
}

const CHECK = 26;

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  relative: { marginTop: spacing.xs },
  details: { paddingVertical: spacing.xs, gap: 0 },
  reminders: { flexDirection: 'row', gap: spacing.sm },
  reminder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  reminderOn: { backgroundColor: colors.violetSoft },
  question: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  pressed: { backgroundColor: colors.canvas },
  check: {
    width: CHECK,
    height: CHECK,
    borderRadius: CHECK / 2,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.sage, borderColor: colors.sage },
});
