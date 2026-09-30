import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { DateTile } from '@/components/DateTile';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { LargeTitle } from '@/components/LargeTitle';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import type { Db } from '@/db/types';
import { formatRelativeDays, formatTime, toDateTimeKey } from '@/domain/dates';
import { appointmentTypeLabels } from '@/domain/labels';
import type { Appointment } from '@/domain/types';
import { useFocusQuery } from '@/hooks/useFocusQuery';
import { countOpenQuestions, listAppointments } from '@/repositories/appointments';
import { colors, spacing } from '@/theme';

type When = 'upcoming' | 'past';

async function loadAppointments(db: Db) {
  const [appointments, openQuestions] = await Promise.all([listAppointments(db), countOpenQuestions(db)]);
  return { appointments, openQuestions };
}

export default function AppointmentsScreen() {
  const [when, setWhen] = useState<When>('upcoming');
  const { data } = useFocusQuery(loadAppointments);
  const appointments = data?.appointments ?? [];
  const openQuestions = data?.openQuestions ?? {};
  const now = toDateTimeKey(new Date());
  const upcoming = appointments
    .filter((a) => a.datetime >= now)
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
  const past = appointments
    .filter((a) => a.datetime < now)
    .sort((a, b) => b.datetime.localeCompare(a.datetime));
  const items = when === 'upcoming' ? upcoming : past;

  return (
    <Screen tab>
      <LargeTitle
        title="Consultas"
        subtitle="Consultas, exames e infusões"
        accessory={
          <IconButton icon="add" accessibilityLabel="Agendar consulta" onPress={() => router.push('/appointments/form')} />
        }
      />

      <SegmentedControl
        value={when}
        onChange={setWhen}
        segments={[
          { value: 'upcoming', label: 'Próximas', count: upcoming.length },
          { value: 'past', label: 'Passadas', count: past.length },
        ]}
      />

      {!data ? null : items.length === 0 ? (
        <EmptyState
          icon="calendar-clear-outline"
          message={when === 'upcoming' ? 'Nenhuma consulta agendada. Toque em + para guardar a próxima.' : 'Nenhuma consulta passada.'}
        />
      ) : (
        <Surface padded={false}>
          {items.map((a, index) => (
            <AppointmentRow
              key={a.id}
              appointment={a}
              first={index === 0}
              upcoming={when === 'upcoming'}
              openQuestions={openQuestions[a.id] ?? 0}
            />
          ))}
        </Surface>
      )}
    </Screen>
  );
}

interface AppointmentRowProps {
  appointment: Appointment;
  first: boolean;
  upcoming: boolean;
  openQuestions: number;
}

function AppointmentRow({ appointment, first, upcoming, openQuestions: pending }: AppointmentRowProps) {
  return (
    <ListRow
      first={first}
      leading={<DateTile date={appointment.datetime} highlighted={upcoming} />}
      accessibilityLabel={`Abrir ${appointmentTypeLabels[appointment.type]}`}
      onPress={() => router.push({ pathname: '/appointments/[id]', params: { id: String(appointment.id) } })}
    >
      <Text variant="bodyStrong">{appointmentTypeLabels[appointment.type]}</Text>
      <Meta icon="time-outline" text={`${formatTime(appointment.datetime)}, ${formatRelativeDays(appointment.datetime)}`} />
      {appointment.location && <Meta icon="location-outline" text={appointment.location} />}
      {upcoming && pending > 0 && (
        <View style={styles.chip}>
          <Chip
            tone="violet"
            icon="chatbubble-ellipses-outline"
            label={pending === 1 ? '1 pergunta' : `${pending} perguntas`}
          />
        </View>
      )}
    </ListRow>
  );
}

function Meta({ icon, text }: { icon: 'time-outline' | 'location-outline'; text: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={13} color={colors.inkSoft} />
      <Text variant="caption" numberOfLines={1} style={styles.metaText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { flexShrink: 1 },
  chip: { marginTop: spacing.xs },
});
