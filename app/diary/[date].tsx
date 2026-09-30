import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Field } from '@/components/form/Field';
import { FieldInput } from '@/components/form/FieldInput';
import { TextField } from '@/components/form/TextField';
import { Screen } from '@/components/Screen';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { activeFields, type ConditionDefinition } from '@/conditions';
import { useDb } from '@/db/client';
import type { Db } from '@/db/types';
import { formatDateShort, formatDayMonth, formatWeekdayLong, isDateKey, todayKey } from '@/domain/dates';
import { buildDiarySchema, initialDiaryValues, valuesToSave, type DiaryFormValues } from '@/domain/diarySchema';
import { capitalizeFirst, isDateInEpisode } from '@/domain/format';
import type { DiaryEntry, Episode } from '@/domain/types';
import { useFocusQuery } from '@/hooks/useFocusQuery';
import { getPrimaryCondition } from '@/repositories/conditions';
import {
  endEpisode,
  getDiaryEntry,
  getPreviousDiaryEntry,
  listEpisodes,
  saveDiaryEntry,
  startEpisode,
} from '@/repositories/diary';
import { colors, radius, spacing } from '@/theme';

export default function DiaryEntryScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();

  if (!isDateKey(date)) {
    return (
      <Screen>
        <EmptyState icon="help-circle-outline" message="Esta data não é válida." />
      </Screen>
    );
  }
  if (date > todayKey()) {
    return (
      <Screen>
        <EmptyState icon="calendar-clear-outline" message="Este dia ainda não chegou. Registre quando ele acontecer." />
      </Screen>
    );
  }

  return <DiaryEntryLoader date={date} />;
}

function DiaryEntryLoader({ date }: { date: string }) {
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
  const { data, reload } = useFocusQuery(load);
  if (!data) return <Screen>{null}</Screen>;

  // A chave evita reiniciar o formulário quando a tela recarrega (ex.: depois de marcar crise).
  return (
    <DiaryForm
      key={`${data.condition.id}-${data.entry?.id ?? 'new'}`}
      date={date}
      condition={data.condition}
      entry={data.entry}
      previous={data.previous}
      episodes={data.episodes}
      onEpisodeChange={reload}
    />
  );
}

interface DiaryFormProps {
  date: string;
  condition: ConditionDefinition;
  entry: DiaryEntry | null;
  previous: DiaryEntry | null;
  episodes: Episode[];
  onEpisodeChange: () => void;
}

function DiaryForm({ date, condition, entry, previous, episodes, onEpisodeChange }: DiaryFormProps) {
  const db = useDb();
  const insets = useSafeAreaInsets();
  const schema = useMemo(() => buildDiarySchema(condition), [condition]);
  const fields = activeFields(condition);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DiaryFormValues>({
    resolver: zodResolver(schema) as Resolver<DiaryFormValues>,
    defaultValues: initialDiaryValues(condition, entry, previous),
  });

  const onSave = handleSubmit(
    async (form) => {
      await saveDiaryEntry(db, {
        conditionId: condition.id,
        date,
        values: valuesToSave(entry?.values ?? null, form),
        notes: form.notes.trim() === '' ? null : form.notes.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  );

  const openEpisode = episodes.find((e) => e.endDate === null) ?? null;
  const inEpisode = isDateInEpisode(date, episodes);
  const label = condition.episodeLabel;

  async function toggleEpisode() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (openEpisode) await endEpisode(db, openEpisode, date);
    else await startEpisode(db, condition.id, date);
    onEpisodeChange();
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="bodyStrong" color={colors.violet}>
            {capitalizeFirst(formatWeekdayLong(date))}
          </Text>
          <Text variant="display">{formatDayMonth(date)}</Text>
        </View>
        {inEpisode && <Chip tone="rose" icon="flame" label={`Dia de ${label}`} />}
        {!entry && previous && (
          <Text variant="caption">
            Preenchido com o registro de {formatDateShort(previous.date)}. Ajuste o que mudou e salve.
          </Text>
        )}

        <Surface style={styles.fields}>
          {fields.map((field, index) => (
            <View key={field.key} style={index > 0 && styles.divider}>
              <Controller
                control={control}
                name={`values.${field.key}`}
                render={({ field: input }) => (
                  <FieldInput
                    field={field}
                    value={input.value ?? null}
                    onChange={input.onChange}
                    error={errors.values?.[field.key]?.message}
                  />
                )}
              />
            </View>
          ))}
        </Surface>

        <Field label="Nota" error={errors.notes?.message}>
          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <TextField
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Algo que valha lembrar na consulta"
                multiline
                maxLength={1000}
                accessibilityLabel="Nota do dia"
              />
            )}
          />
        </Field>

        <View style={[styles.episode, openEpisode && styles.episodeOpen]}>
          <Ionicons name={openEpisode ? 'flame' : 'flame-outline'} size={22} color={colors.rose} />
          <View style={styles.flex}>
            <Text variant="bodyStrong">
              {openEpisode
                ? `Em ${label} desde ${formatDateShort(openEpisode.startDate)}`
                : `Sem ${label} em andamento`}
            </Text>
            <Text variant="caption">
              {openEpisode
                ? `Quando melhorar, marque o fim. A data de fim será ${formatDateShort(date < openEpisode.startDate ? openEpisode.startDate : date)}.`
                : `Marque o início para destacar os dias de ${label} no histórico.`}
            </Text>
          </View>
        </View>
        <Button
          variant={openEpisode ? 'soft' : 'danger'}
          icon={openEpisode ? 'checkmark-circle-outline' : 'flame-outline'}
          title={openEpisode ? `${capitalizeFirst(label)} encerrou` : `Estou em ${label}`}
          onPress={toggleEpisode}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Button title={entry ? 'Salvar alterações' : 'Salvar registro'} onPress={onSave} disabled={isSubmitting} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  content: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg },
  header: { gap: 2 },
  fields: { paddingVertical: spacing.xs, gap: 0 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  episode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
  },
  episodeOpen: { backgroundColor: colors.roseSoft },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
});
