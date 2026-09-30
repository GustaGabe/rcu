import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { IconBadge } from '@/components/IconBadge';
import { InfoRow } from '@/components/InfoRow';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { formatDateMedium } from '@/domain/dates';
import { medicationFormLabels, medicationStatusSingular } from '@/domain/labels';
import type { MedicationStatus } from '@/domain/types';
import { medications, schedules } from '@/mocks/data';
import { colors, fonts, radius, spacing, type Tone } from '@/theme';

const statusTones: Record<MedicationStatus, Tone> = { active: 'sage', paused: 'amber', archived: 'neutral' };

export default function MedicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (id === 'new') {
    return (
      <Screen>
        <Text variant="display">Novo remédio</Text>
        <EmptyState icon="construct-outline" message="O cadastro de remédios chega na etapa 4." />
      </Screen>
    );
  }

  const med = medications.find((m) => String(m.id) === id);
  if (!med) {
    return (
      <Screen>
        <EmptyState icon="help-circle-outline" message="Este remédio não existe mais." />
      </Screen>
    );
  }

  const medSchedules = schedules
    .filter((s) => s.medicationId === med.id)
    .sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));

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

      <SectionHeader title="Horários" />
      {medSchedules.length === 0 ? (
        <EmptyState icon="time-outline" message="Nenhum horário cadastrado." />
      ) : (
        <View style={styles.times}>
          {medSchedules.map((s) => (
            <View key={s.id} style={styles.time}>
              <Text style={styles.timeValue}>{s.timeOfDay}</Text>
              <Text variant="label">
                {s.frequency === 'daily' ? 'todo dia' : `a cada ${s.intervalDays} dias`}
              </Text>
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

      <EmptyState icon="construct-outline" message="Editar, pausar e arquivar chegam na etapa 4." />
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
});
