import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { IconBadge } from '@/components/IconBadge';
import { InfoRow } from '@/components/InfoRow';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useDb } from '@/db/client';
import type { Db } from '@/db/types';
import { formatDateMedium, todayKey } from '@/domain/dates';
import { medicationFormLabels, medicationStatusSingular } from '@/domain/labels';
import { isScheduleCurrent } from '@/domain/schedule';
import type { MedicationStatus } from '@/domain/types';
import { useFocusQuery } from '@/hooks/useFocusQuery';
import { getMedication, listSchedules, setMedicationStatus } from '@/repositories/medications';
import { colors, fonts, radius, spacing, type Tone } from '@/theme';

const statusTones: Record<MedicationStatus, Tone> = { active: 'sage', paused: 'amber', archived: 'neutral' };

const statusNotes: Partial<Record<MedicationStatus, string>> = {
  paused: 'Pausado: as doses não aparecem na tela Hoje nem contam na adesão.',
  archived: 'Arquivado: fora da lista de uso, com todo o histórico de doses guardado.',
};

export default function MedicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MedicationDetail id={Number(id)} />;
}

function MedicationDetail({ id }: { id: number }) {
  const db = useDb();
  const load = useCallback(
    async (db: Db) => {
      const today = todayKey();
      const [med, schedules] = await Promise.all([getMedication(db, id), listSchedules(db, id)]);
      return { med, schedules: schedules.filter((s) => isScheduleCurrent(s, today)) };
    },
    [id],
  );
  const { data, reload } = useFocusQuery(load);
  if (!data) return <Screen>{null}</Screen>;

  const { med, schedules: medSchedules } = data;
  if (!med) {
    return (
      <Screen>
        <EmptyState icon="help-circle-outline" message="Este remédio não existe mais." />
      </Screen>
    );
  }
  const medId = med.id;
  const medName = med.name;

  async function changeStatus(status: MedicationStatus) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setMedicationStatus(db, medId, status);
    reload();
  }

  function confirmArchive() {
    Alert.alert(
      `Arquivar ${medName}?`,
      'Ele sai da lista de remédios em uso e para de gerar doses. O histórico fica guardado e você pode reativar depois.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Arquivar', style: 'destructive', onPress: () => changeStatus('archived') },
      ],
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <IconBadge form={med.form} size={64} muted={med.status !== 'active'} />
        <View style={styles.flex}>
          <Text variant="title">{med.name}</Text>
          <Text variant="caption">{med.dose}</Text>
          <View style={styles.status}>
            <Chip tone={statusTones[med.status]} label={medicationStatusSingular[med.status]} />
          </View>
        </View>
      </View>
      {statusNotes[med.status] && <Text variant="caption">{statusNotes[med.status]}</Text>}

      <SectionHeader title="Horários" />
      {medSchedules.length === 0 ? (
        <EmptyState icon="time-outline" message="Nenhum horário cadastrado. Toque em Editar para adicionar." />
      ) : (
        <View style={styles.times}>
          {medSchedules.map((s) => (
            <View key={s.id} style={styles.time}>
              <Text style={styles.timeValue}>{s.timeOfDay}</Text>
              <Text variant="label">{s.frequency === 'daily' ? 'todo dia' : `a cada ${s.intervalDays} dias`}</Text>
            </View>
          ))}
        </View>
      )}

      <SectionHeader title="Detalhes" />
      <Surface style={styles.details}>
        <InfoRow first icon="medical-outline" label="Forma" value={medicationFormLabels[med.form]} />
        <InfoRow icon="play-outline" label="Início" value={formatDateMedium(med.startDate)} />
        <InfoRow icon="stop-outline" label="Término" value={med.endDate ? formatDateMedium(med.endDate) : 'Sem data'} />
      </Surface>

      {med.notes && (
        <Surface>
          <Text variant="label">Observações</Text>
          <Text>{med.notes}</Text>
        </Surface>
      )}

      <View style={styles.actions}>
        <Button
          title="Editar"
          icon="create-outline"
          onPress={() => router.push({ pathname: '/meds/form', params: { id: String(med.id) } })}
        />
        {med.status === 'active' && (
          <Button title="Pausar" variant="soft" icon="pause" onPress={() => changeStatus('paused')} />
        )}
        {med.status !== 'active' && (
          <Button title="Reativar" variant="soft" icon="play" onPress={() => changeStatus('active')} />
        )}
        {med.status !== 'archived' && (
          <Button title="Arquivar" variant="danger" icon="archive-outline" onPress={confirmArchive} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  status: { marginTop: spacing.xs },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  time: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 104,
    gap: 2,
  },
  timeValue: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.ink },
  details: { paddingVertical: spacing.xs, gap: 0 },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
