import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { addDays } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { DateTimeField } from '@/components/form/DateTimeField';
import { Field } from '@/components/form/Field';
import { OptionGrid } from '@/components/form/OptionGrid';
import { SwitchRow } from '@/components/form/SwitchRow';
import { TextField } from '@/components/form/TextField';
import { SectionHeader } from '@/components/SectionHeader';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useDb } from '@/db/client';
import {
  appointmentFormSchema,
  appointmentFormToDraft,
  appointmentToForm,
  emptyAppointmentForm,
  type AppointmentFormValues,
} from '@/domain/appointmentForm';
import { toDateKey } from '@/domain/dates';
import { appointmentTypeLabels } from '@/domain/labels';
import type { AppointmentType } from '@/domain/types';
import { askForRemindersIfNeeded, rescheduleAll } from '@/notifications/scheduler';
import { createAppointment, getAppointment, updateAppointment } from '@/repositories/appointments';
import { getPrimaryCondition } from '@/repositories/conditions';
import { colors, spacing } from '@/theme';

const TYPES: AppointmentType[] = ['consultation', 'exam', 'infusion'];
const typeIcons: Record<AppointmentType, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  consultation: 'stethoscope',
  exam: 'test-tube',
  infusion: 'iv-bag',
};

/** Cadastro (sem `id`) e edição (com `id`) de consulta, exame ou infusão, aberto como modal. */
export default function AppointmentFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : null;
  const db = useDb();
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(id === null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    // Amanhã por padrão: uma consulta nova quase sempre é no futuro.
    defaultValues: emptyAppointmentForm(toDateKey(addDays(new Date(), 1))),
  });

  useEffect(() => {
    if (id === null) return;
    let active = true;
    getAppointment(db, id).then((appointment) => {
      if (!active || !appointment) return;
      reset(appointmentToForm(appointment));
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [db, id, reset]);

  const onSubmit = handleSubmit(
    async (values) => {
      const draft = appointmentFormToDraft(values);
      if (id === null) {
        const condition = await getPrimaryCondition(db);
        await createAppointment(db, { ...draft, conditionId: condition.id });
      } else {
        const current = await getAppointment(db, id);
        await updateAppointment(db, id, { ...draft, conditionId: current?.conditionId ?? null });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (draft.remind1d || draft.remind2h) await askForRemindersIfNeeded();
      await rescheduleAll(db);
      router.back();
    },
    () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: id === null ? 'Nova consulta' : 'Editar consulta',
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
          <Field label="Tipo">
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <OptionGrid
                  value={field.value}
                  onChange={field.onChange}
                  options={TYPES.map((type) => ({
                    value: type,
                    label: appointmentTypeLabels[type],
                    icon: (selected) => (
                      <MaterialCommunityIcons
                        name={typeIcons[type]}
                        size={24}
                        color={selected ? colors.violet : colors.inkSoft}
                      />
                    ),
                  }))}
                />
              )}
            />
          </Field>

          <Surface style={styles.group}>
            <View style={styles.row}>
              <Text variant="bodyStrong" style={styles.flex}>
                Data
              </Text>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <DateTimeField mode="date" value={field.value} onChange={field.onChange} accessibilityLabel="Data" />
                )}
              />
            </View>
            <View style={[styles.row, styles.divider]}>
              <Text variant="bodyStrong" style={styles.flex}>
                Horário
              </Text>
              <Controller
                control={control}
                name="time"
                render={({ field }) => (
                  <DateTimeField mode="time" value={field.value} onChange={field.onChange} accessibilityLabel="Horário" />
                )}
              />
            </View>
          </Surface>

          <Field label="Profissional" error={errors.professional?.message}>
            <Controller
              control={control}
              name="professional"
              render={({ field }) => (
                <TextField
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Gastroenterologista"
                  autoCapitalize="words"
                  maxLength={80}
                  accessibilityLabel="Profissional"
                />
              )}
            />
          </Field>

          <Field label="Local" error={errors.location?.message}>
            <Controller
              control={control}
              name="location"
              render={({ field }) => (
                <TextField
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Clínica, endereço ou sala"
                  maxLength={120}
                  accessibilityLabel="Local"
                />
              )}
            />
          </Field>

          <SectionHeader title="Lembretes" />
          <Surface style={styles.group}>
            <View style={styles.row}>
              <Controller
                control={control}
                name="remind1d"
                render={({ field }) => (
                  <View style={styles.flex}>
                    <SwitchRow label="1 dia antes" value={field.value} onChange={field.onChange} />
                  </View>
                )}
              />
            </View>
            <View style={[styles.row, styles.divider]}>
              <Controller
                control={control}
                name="remind2h"
                render={({ field }) => (
                  <View style={styles.flex}>
                    <SwitchRow label="2 horas antes" value={field.value} onChange={field.onChange} />
                  </View>
                )}
              />
            </View>
          </Surface>

          <Field label="Observações" error={errors.notes?.message}>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <TextField
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Ex.: levar os últimos exames, ir em jejum"
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
          title={id === null ? 'Salvar consulta' : 'Salvar alterações'}
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
  group: { paddingVertical: spacing.xs, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
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
