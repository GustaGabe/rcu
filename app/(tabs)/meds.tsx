import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { IconBadge } from '@/components/IconBadge';
import { IconButton } from '@/components/IconButton';
import { LargeTitle } from '@/components/LargeTitle';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import type { Db } from '@/db/types';
import { describeSchedules } from '@/domain/format';
import { medicationStatusLabels } from '@/domain/labels';
import type { MedicationStatus } from '@/domain/types';
import { useFocusQuery } from '@/hooks/useFocusQuery';
import { listMedications, listSchedules } from '@/repositories/medications';
import { colors, spacing } from '@/theme';

const statuses: MedicationStatus[] = ['active', 'paused', 'archived'];

const emptyMessages: Record<MedicationStatus, string> = {
  active: 'Nenhum remédio ativo. Toque em + para cadastrar o primeiro.',
  paused: 'Nenhum remédio pausado.',
  archived: 'Remédios arquivados aparecem aqui, com o histórico preservado.',
};

async function loadMeds(db: Db) {
  const [medications, schedules] = await Promise.all([listMedications(db), listSchedules(db)]);
  return { medications, schedules };
}

export default function MedsScreen() {
  const [status, setStatus] = useState<MedicationStatus>('active');
  const { data } = useFocusQuery(loadMeds);
  const medications = data?.medications ?? [];
  const schedules = data?.schedules ?? [];
  const items = medications.filter((m) => m.status === status);
  const activeCount = medications.filter((m) => m.status === 'active').length;

  return (
    <Screen tab>
      <LargeTitle
        title="Remédios"
        subtitle={activeCount === 1 ? '1 remédio em uso' : `${activeCount} remédios em uso`}
        accessory={
          <IconButton
            icon="add"
            accessibilityLabel="Cadastrar remédio"
            onPress={() => router.push({ pathname: '/meds/[id]', params: { id: 'new' } })}
          />
        }
      />

      <SegmentedControl
        value={status}
        onChange={setStatus}
        segments={statuses.map((s) => ({
          value: s,
          label: medicationStatusLabels[s],
          count: medications.filter((m) => m.status === s).length,
        }))}
      />

      {!data ? null : items.length === 0 ? (
        <EmptyState icon="medkit-outline" message={emptyMessages[status]} />
      ) : (
        <Surface padded={false}>
          {items.map((med, index) => (
            <ListRow
              key={med.id}
              first={index === 0}
              leading={<IconBadge form={med.form} muted={status !== 'active'} />}
              accessibilityLabel={`Abrir ${med.name}`}
              onPress={() => router.push({ pathname: '/meds/[id]', params: { id: String(med.id) } })}
            >
              <Text variant="bodyStrong" numberOfLines={1}>
                {med.name}
              </Text>
              <Text variant="caption" numberOfLines={1}>
                {med.dose}
              </Text>
              <View style={styles.schedule}>
                <Ionicons name="time-outline" size={13} color={colors.violet} />
                <Text variant="label" color={colors.violet} numberOfLines={1}>
                  {describeSchedules(schedules.filter((s) => s.medicationId === med.id))}
                </Text>
              </View>
            </ListRow>
          ))}
        </Surface>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  schedule: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
});
