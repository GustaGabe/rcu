import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { DateTile } from '@/components/DateTile';
import { EmptyState } from '@/components/EmptyState';
import { TextField } from '@/components/form/TextField';
import { InfoRow } from '@/components/InfoRow';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useDb } from '@/db/client';
import type { Db } from '@/db/types';
import { formatRelativeDays, formatTime, formatWeekdayLong, toDateTimeKey } from '@/domain/dates';
import { capitalizeFirst } from '@/domain/format';
import { appointmentTypeLabels } from '@/domain/labels';
import type { DoctorQuestion } from '@/domain/types';
import { useFocusQuery } from '@/hooks/useFocusQuery';
import { rescheduleAll } from '@/notifications/scheduler';
import {
  createQuestion,
  deleteAppointment,
  deleteQuestion,
  getAppointment,
  listQuestions,
  setQuestionAsked,
  updateQuestion,
} from '@/repositories/appointments';
import { colors, radius, spacing } from '@/theme';

export default function AppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AppointmentDetail id={Number(id)} />;
}

function AppointmentDetail({ id }: { id: number }) {
  const db = useDb();
  const load = useCallback(
    async (db: Db) => {
      const [appointment, questions] = await Promise.all([getAppointment(db, id), listQuestions(db, id)]);
      return { appointment, questions };
    },
    [id],
  );
  const { data, reload } = useFocusQuery(load);
  if (!data) return <Screen>{null}</Screen>;

  const { appointment, questions } = data;
  if (!appointment) {
    return (
      <Screen>
        <EmptyState icon="help-circle-outline" message="Esta consulta não existe mais." />
      </Screen>
    );
  }

  const upcoming = appointment.datetime >= toDateTimeKey(new Date());
  const asked = questions.filter((q) => q.asked).length;
  const appointmentId = appointment.id;
  const typeLabel = appointmentTypeLabels[appointment.type];

  async function toggleAsked(questionId: number, value: boolean) {
    Haptics.selectionAsync();
    await setQuestionAsked(db, questionId, value);
    reload();
  }

  async function addQuestion(text: string) {
    await createQuestion(db, { appointmentId, question: text, answer: null, asked: false });
    reload();
  }

  function confirmDelete() {
    Alert.alert(`Apagar ${typeLabel.toLowerCase()}?`, 'A consulta, os lembretes e as perguntas dela serão apagados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await deleteAppointment(db, appointmentId);
          await rescheduleAll(db);
          router.back();
        },
      },
    ]);
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
      {questions.length > 0 && (
        <Surface padded={false}>
          {questions.map((q, index) => (
            <QuestionRow
              key={q.id}
              question={q}
              first={index === 0}
              onToggle={() => toggleAsked(q.id, !q.asked)}
              onChanged={reload}
            />
          ))}
        </Surface>
      )}
      <AddQuestion onAdd={addQuestion} empty={questions.length === 0} />

      <View style={styles.actions}>
        <Button
          title="Editar"
          icon="create-outline"
          onPress={() => router.push({ pathname: '/appointments/form', params: { id: String(appointmentId) } })}
        />
        <Button title="Apagar" variant="danger" icon="trash-outline" onPress={confirmDelete} />
      </View>
    </Screen>
  );
}

interface QuestionRowProps {
  question: DoctorQuestion;
  first: boolean;
  onToggle: () => void;
  onChanged: () => void;
}

/** Pergunta com check de "perguntei". Tocar no texto abre a resposta do médico para edição. */
function QuestionRow({ question, first, onToggle, onChanged }: QuestionRowProps) {
  const db = useDb();
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState(question.answer ?? '');

  async function saveAnswer() {
    await updateQuestion(db, question.id, question.question, answer.trim() === '' ? null : answer.trim());
    if (!question.asked && answer.trim() !== '') await setQuestionAsked(db, question.id, true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOpen(false);
    onChanged();
  }

  function confirmDelete() {
    Alert.alert('Apagar pergunta?', question.question, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await deleteQuestion(db, question.id);
          onChanged();
        },
      },
    ]);
  }

  return (
    <View style={[styles.question, !first && styles.divider]}>
      <View style={styles.questionRow}>
        <Pressable
          onPress={onToggle}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: question.asked }}
          accessibilityLabel={`Perguntei: ${question.question}`}
          style={[styles.check, question.asked && styles.checkOn]}
        >
          {question.asked && (
            <Animated.View entering={ZoomIn.springify().damping(12)}>
              <Ionicons name="checkmark" size={16} color={colors.onPlum} />
            </Animated.View>
          )}
        </Pressable>
        <Pressable
          style={styles.flex}
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityHint="Abre a resposta do médico"
        >
          <Text color={question.asked ? colors.inkSoft : colors.ink}>{question.question}</Text>
          {question.answer && !open && <Text variant="caption">{question.answer}</Text>}
          {!question.answer && !open && (
            <Text variant="label" color={colors.violet}>
              Anotar resposta
            </Text>
          )}
        </Pressable>
      </View>
      {open && (
        <View style={styles.answer}>
          <TextField
            value={answer}
            onChangeText={setAnswer}
            placeholder="O que o médico respondeu"
            multiline
            maxLength={1000}
            accessibilityLabel="Resposta do médico"
          />
          <View style={styles.answerActions}>
            <Pressable onPress={confirmDelete} hitSlop={8} accessibilityRole="button" accessibilityLabel="Apagar pergunta">
              <Ionicons name="trash-outline" size={22} color={colors.rose} />
            </Pressable>
            <Button title="Salvar resposta" size="sm" variant="soft" onPress={saveAnswer} />
          </View>
        </View>
      )}
    </View>
  );
}

function AddQuestion({ onAdd, empty }: { onAdd: (text: string) => Promise<void>; empty: boolean }) {
  const [text, setText] = useState('');

  async function submit() {
    const value = text.trim();
    if (value === '') return;
    Haptics.selectionAsync();
    setText('');
    await onAdd(value);
  }

  return (
    <View style={styles.add}>
      {empty && <Text variant="caption">Anote as dúvidas que surgirem até a consulta para não esquecer na hora.</Text>}
      <View style={styles.addRow}>
        <View style={styles.flex}>
          <TextField
            value={text}
            onChangeText={setText}
            placeholder="Nova pergunta"
            returnKeyType="done"
            onSubmitEditing={submit}
            maxLength={300}
            accessibilityLabel="Nova pergunta"
          />
        </View>
        <Pressable
          onPress={submit}
          disabled={text.trim() === ''}
          accessibilityRole="button"
          accessibilityLabel="Adicionar pergunta"
          hitSlop={6}
          style={[styles.addButton, text.trim() === '' && styles.addButtonOff]}
        >
          <Ionicons name="add" size={24} color={colors.onViolet} />
        </Pressable>
      </View>
    </View>
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
  question: { padding: spacing.lg, gap: spacing.md },
  questionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  answer: { gap: spacing.sm, marginLeft: 26 + spacing.md },
  answerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  add: { gap: spacing.sm },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonOff: { opacity: 0.4 },
  actions: { gap: spacing.sm, marginTop: spacing.md },
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
