import { router } from 'expo-router';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { formatDateTime, toDateTimeKey } from '@/domain/dates';
import { appointmentTypeLabels } from '@/domain/labels';
import type { Appointment } from '@/domain/types';
import { appointments } from '@/mocks/data';

export default function AppointmentsScreen() {
  const now = toDateTimeKey(new Date());
  const upcoming = appointments
    .filter((a) => a.datetime >= now)
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
  const past = appointments
    .filter((a) => a.datetime < now)
    .sort((a, b) => b.datetime.localeCompare(a.datetime));

  return (
    <Screen>
      <SectionHeader title="Próximas" />
      {upcoming.length === 0 ? (
        <EmptyState message="Nenhuma consulta agendada." />
      ) : (
        upcoming.map((a) => <AppointmentCard key={a.id} appointment={a} />)
      )}

      <SectionHeader title="Passadas" />
      {past.length === 0 ? (
        <EmptyState message="Nenhuma consulta passada." />
      ) : (
        past.map((a) => <AppointmentCard key={a.id} appointment={a} />)
      )}
    </Screen>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  return (
    <Card
      onPress={() =>
        router.push({ pathname: '/appointments/[id]', params: { id: String(appointment.id) } })
      }
    >
      <Text variant="heading">{appointmentTypeLabels[appointment.type]}</Text>
      <Text>{formatDateTime(appointment.datetime)}</Text>
      {appointment.professional && <Text variant="caption">{appointment.professional}</Text>}
      {appointment.location && <Text variant="caption">{appointment.location}</Text>}
    </Card>
  );
}
