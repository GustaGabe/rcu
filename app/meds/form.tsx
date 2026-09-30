import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { DateTimeField } from '@/components/form/DateTimeField';
import { Field } from '@/components/form/Field';
import { OptionGrid } from '@/components/form/OptionGrid';
import { Stepper } from '@/components/form/Stepper';
import { SwitchRow } from '@/components/form/SwitchRow';
import { TextField } from '@/components/form/TextField';
import { medicationFormIcons } from '@/components/IconBadge';
import { SectionHeader } from '@/components/SectionHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useDb } from '@/db/client';
import { todayKey } from '@/domain/dates';
import { medicationFormLabels } from '@/domain/labels';
import {
  emptyMedicationForm,
  formToDraft,
  medicationFormSchema,
  medicationToForm,
  suggestNextTime,
  type MedicationFormValues,
} from '@/domain/medicationForm';
import { isScheduleCurrent } from '@/domain/schedule';
import type { MedicationForm } from '@/domain/types';
import { askForRemindersIfNeeded, rescheduleAll } from '@/notifications/scheduler';
import { getPrimaryCondition } from '@/repositories/conditions';
import { createMedication, getMedication, listSchedules, updateMedication } from '@/repositories/medications';
import { colors, fonts, spacing } from '@/theme';

const FORMS: MedicationForm[] = ['tablet', 'suppository', 'enema', 'injection', 'infusion', 'other'];

/** Cadastro (sem `id`) e edição (com `id`) de remédio, aberto como modal. */
export default function MedicationFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : null;
  const db = useDb();
  const insets = useSafeAreaInsets();
  const today = todayKey();
  const [ready, setReady] = useState(id === null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: emptyMedicationForm(today),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (id === null) return;
    let active = true;
    Promise.all([getMedication(db, id), listSchedules(db, id)]).then(([med, schedules]) => {
      if (!active || !med) return;
      reset(medicationToForm(med, schedules.filter((s) => isScheduleCurrent(s, today)), today));
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [db, id, reset, today]);

  const [frequency, times, hasEndDate, startDate] = useWatch({
    control,
    name: ['frequency', 'times', 'hasEndDate', 'startDate'],
  });

  function setTimes(next: string[]) {
    setValue('times', next, { shouldValidate: true, shouldDirty: true });
  }

  const onSubmit = handleSubmit(
    async (values) => {
      const draft = formToDraft(values);
      if (id === null) {
        const condition = await getPrimaryCondition(db);
        await createMedication(db, { ...draft, conditionId: condition.id });
      } else {
        await updateMedication(db, id, draft, today);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await askForRemindersIfNeeded();
      await rescheduleAll(db);
      router.back();
    },
    () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  );

  const timesError = errors.times?.message ?? errors.times?.root?.message;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: id === null ? 'Novo remédio' : 'Editar remédio',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
              <Text color={colors.violet} variant="bodyStrong">
                Cancelar
              </Text>
            </Pressable>
          ),
        }}
      />

      {ready && (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Field label="Nome" error={errors.name?.message}>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <TextField
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Mesalazina"
                  autoCapitalize="words"
                  maxLength={80}
                  invalid={!!errors.name}
                  accessibilityLabel="Nome do remédio"
                />
              )}
            />
          </Field>

          <Field label="Dose" error={errors.dose?.message} hint="Do jeito que está na receita.">
            <Controller
              control={control}
              name="dose"
              render={({ field }) => (
                <TextField
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="2 comprimidos de 800 mg"
                  maxLength={120}
                  invalid={!!errors.dose}
                  accessibilityLabel="Dose"
                />
              )}
            />
          </Field>

          <Field label="Forma">
            <Controller
              control={control}
              name="form"
              render={({ field }) => (
                <OptionGrid
                  value={field.value}
                  onChange={field.onChange}
                  options={FORMS.map((form) => ({
                    value: form,
                    label: medicationFormLabels[form],
                    icon: (selected) => (
                      <MaterialCommunityIcons
                        name={medicationFormIcons[form].icon}
                        size={24}
                        color={selected ? colors.violet : colors.inkSoft}
                      />
                    ),
                  }))}
                />
              )}
            />
          </Field>

          <SectionHeader title="Quando tomar" />
          <Controller
            control={control}
            name="frequency"
            render={({ field }) => (
              <SegmentedControl
                value={field.value}
                onChange={field.onChange}
                segments={[
                  { value: 'daily', label: 'Todo dia' },
                  { value: 'interval', label: 'Com intervalo' },
                ]}
              />
            )}
          />

          {frequency === 'daily' ? (
            <Field error={timesError}>
              <Surface style={styles.times}>
                {times.map((time, index) => (
                  <View key={`${index}-${time}`} style={[styles.timeRow, index > 0 && styles.divider]}>
                    <Text variant="caption" style={styles.timeLabel}>
                      {times.length > 1 ? `${index + 1}º horário` : 'Horário'}
                    </Text>
                    <DateTimeField
                      mode="time"
                      value={time}
                      accessibilityLabel={`Horário ${index + 1}`}
                      onChange={(next) => setTimes(times.map((t, i) => (i === index ? next : t)))}
                    />
                    {times.length > 1 && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remover horário das ${time}`}
                        hitSlop={8}
                        onPress={() => setTimes(times.filter((_, i) => i !== index))}
                      >
                        <MaterialCommunityIcons name="close-circle" size={22} color={colors.inkSoft} />
                      </Pressable>
                    )}
                  </View>
                ))}
              </Surface>
              <Button
                title="Adicionar horário"
                variant="soft"
                icon="add"
                size="sm"
                onPress={() => setTimes([...times, suggestNextTime(times)])}
              />
            </Field>
          ) : (
            <Surface style={styles.interval}>
              <Field
                label="A cada"
                error={errors.intervalValue?.message}
                hint="Contado a partir da data de início."
              >
                <View style={styles.intervalRow}>
                  <Controller
                    control={control}
                    name="intervalValue"
                    render={({ field }) => (
                      <Stepper value={field.value} onChange={field.onChange} accessibilityLabel="Intervalo" />
                    )}
                  />
                  <View style={styles.flex}>
                    <Controller
                      control={control}
                      name="intervalUnit"
                      render={({ field }) => (
                        <SegmentedControl
                          value={field.value}
                          onChange={field.onChange}
                          segments={[
                            { value: 'days', label: 'dias' },
                            { value: 'weeks', label: 'semanas' },
                          ]}
                        />
                      )}
                    />
                  </View>
                </View>
              </Field>
              <View style={[styles.timeRow, styles.divider]}>
                <Text variant="caption" style={styles.timeLabel}>
                  Horário
                </Text>
                <Controller
                  control={control}
                  name="intervalTime"
                  render={({ field }) => (
                    <DateTimeField mode="time" value={field.value} onChange={field.onChange} accessibilityLabel="Horário" />
                  )}
                />
              </View>
            </Surface>
          )}

          <SectionHeader title="Período" />
          <Surface style={styles.period}>
            <View style={styles.timeRow}>
              <Text variant="bodyStrong" style={styles.flex}>
                Início
              </Text>
              <Controller
                control={control}
                name="startDate"
                render={({ field }) => (
                  <DateTimeField mode="date" value={field.value} onChange={field.onChange} accessibilityLabel="Data de início" />
                )}
              />
            </View>
            <View style={[styles.timeRow, styles.divider]}>
              <Controller
                control={control}
                name="hasEndDate"
                render={({ field }) => (
                  <View style={styles.flex}>
                    <SwitchRow label="Tem data de término" value={field.value} onChange={field.onChange} />
                  </View>
                )}
              />
            </View>
            {hasEndDate && (
              <View style={[styles.timeRow, styles.divider]}>
                <Text variant="bodyStrong" style={styles.flex}>
                  Término
                </Text>
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field }) => (
                    <DateTimeField
                      mode="date"
                      value={field.value}
                      minimumDate={startDate}
                      onChange={field.onChange}
                      accessibilityLabel="Data de término"
                    />
                  )}
                />
              </View>
            )}
          </Surface>
          {errors.endDate && (
            <Text variant="caption" color={colors.rose}>
              {errors.endDate.message}
            </Text>
          )}

          <Field label="Observações" error={errors.notes?.message}>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <TextField
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Ex.: tomar após as refeições"
                  multiline
                  maxLength={500}
                  accessibilityLabel="Observações"
                />
              )}
            />
          </Field>
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Button
          title={id === null ? 'Salvar remédio' : 'Salvar alterações'}
          onPress={onSubmit}
          disabled={!ready || isSubmitting}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xl },
  times: { paddingVertical: spacing.xs, gap: 0 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52 },
  timeLabel: { flex: 1, fontFamily: fonts.bodyMedium },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  interval: { gap: spacing.md },
  intervalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  period: { paddingVertical: spacing.xs, gap: 0 },
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
