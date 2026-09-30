import { Stack, useLocalSearchParams } from 'expo-router';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { InfoRow } from '@/components/InfoRow';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { formatDateShort } from '@/domain/dates';
import { describeSchedules } from '@/domain/format';
import { medicationFormLabels, medicationStatusLabels } from '@/domain/labels';
import { medications, schedules } from '@/mocks/data';

export default function MedicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (id === 'new') {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Novo remédio' }} />
        <EmptyState message="O formulário de cadastro chega na etapa 4." />
      </Screen>
    );
  }

  const med = medications.find((m) => String(m.id) === id);
  if (!med) {
    return (
      <Screen>
        <EmptyState message="Remédio não encontrado." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: med.name }} />
      <Card>
        <InfoRow label="Dose" value={med.dose} />
        <InfoRow label="Forma" value={medicationFormLabels[med.form]} />
        <InfoRow label="Situação" value={medicationStatusLabels[med.status]} />
        <InfoRow label="Início" value={formatDateShort(med.startDate)} />
        <InfoRow label="Término" value={med.endDate ? formatDateShort(med.endDate) : 'Sem data'} />
      </Card>

      <SectionHeader title="Horários" />
      <Card>
        <Text>{describeSchedules(schedules.filter((s) => s.medicationId === med.id))}</Text>
      </Card>

      {med.notes && (
        <>
          <SectionHeader title="Observações" />
          <Card>
            <Text>{med.notes}</Text>
          </Card>
        </>
      )}

      <EmptyState message="Editar, pausar e arquivar chegam na etapa 4." />
    </Screen>
  );
}
