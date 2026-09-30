import { router } from 'expo-router';
import { Fragment } from 'react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { describeSchedules } from '@/domain/format';
import { medicationFormLabels, medicationStatusLabels } from '@/domain/labels';
import type { MedicationStatus } from '@/domain/types';
import { medications, schedules } from '@/mocks/data';

const sections: MedicationStatus[] = ['active', 'paused', 'archived'];

export default function MedsScreen() {
  return (
    <Screen>
      <Button
        title="Adicionar remédio"
        onPress={() => router.push({ pathname: '/meds/[id]', params: { id: 'new' } })}
      />

      {sections.map((status) => {
        const items = medications.filter((m) => m.status === status);
        return (
          <Fragment key={status}>
            <SectionHeader title={medicationStatusLabels[status]} />
            {items.length === 0 ? (
              <EmptyState message="Nenhum remédio aqui." />
            ) : (
              items.map((med) => (
                <Card
                  key={med.id}
                  onPress={() => router.push({ pathname: '/meds/[id]', params: { id: String(med.id) } })}
                >
                  <Text variant="heading">{med.name}</Text>
                  <Text>
                    {med.dose} · {medicationFormLabels[med.form]}
                  </Text>
                  <Text variant="caption">
                    {describeSchedules(schedules.filter((s) => s.medicationId === med.id))}
                  </Text>
                </Card>
              ))
            )}
          </Fragment>
        );
      })}
    </Screen>
  );
}
