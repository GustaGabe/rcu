import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { formatDateLong, formatDateTime, formatTime, toDateTimeKey, todayKey } from '@/domain/dates';
import { appointmentTypeLabels } from '@/domain/labels';
import type { ScheduledDose } from '@/domain/types';
import { appointments, diaryEntries, todayDoses } from '@/mocks/data';
import { colors, spacing } from '@/theme';

export default function TodayScreen() {
  const today = todayKey();
  const [doses, setDoses] = useState<ScheduledDose[]>(todayDoses);

  // Estado só em memória por enquanto; na etapa 4 grava em dose_logs.
  function markTaken(dose: ScheduledDose) {
    const takenAt = toDateTimeKey(new Date());
    setDoses((current) =>
      current.map((d) =>
        d.scheduleId === dose.scheduleId && d.scheduledFor === dose.scheduledFor
          ? { ...d, status: 'taken', takenAt }
          : d,
      ),
    );
  }

  const todayEntry = diaryEntries.find((e) => e.date === today);
  const nextAppointment = appointments
    .filter((a) => a.datetime >= `${today}T00:00:00`)
    .sort((a, b) => a.datetime.localeCompare(b.datetime))[0];

  return (
    <Screen>
      <Text variant="title" style={styles.capitalize}>
        {formatDateLong(today)}
      </Text>

      <SectionHeader title="Remédios de hoje" />
      {doses.length === 0 ? (
        <EmptyState message="Nenhuma dose para hoje." />
      ) : (
        doses.map((dose) => (
          <Card key={`${dose.scheduleId}@${dose.scheduledFor}`}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text variant="heading">
                  {formatTime(dose.scheduledFor)} · {dose.medicationName}
                </Text>
                <Text variant="caption">{dose.dose}</Text>
              </View>
              {dose.status === 'pending' ? (
                <Button title="Tomei" onPress={() => markTaken(dose)} />
              ) : (
                <Text variant="caption" style={dose.status === 'taken' ? styles.taken : undefined}>
                  {dose.status === 'taken' && dose.takenAt
                    ? `Tomada às ${formatTime(dose.takenAt)}`
                    : 'Pulada'}
                </Text>
              )}
            </View>
          </Card>
        ))
      )}

      <SectionHeader title="Diário" />
      <Card>
        <Text>{todayEntry ? 'Você já registrou o dia de hoje.' : 'Como você está hoje?'}</Text>
        <View style={styles.action}>
          <Button
            title={todayEntry ? 'Editar registro' : 'Registrar o dia'}
            variant={todayEntry ? 'secondary' : 'primary'}
            onPress={() => router.push({ pathname: '/diary/[date]', params: { date: today } })}
          />
        </View>
      </Card>

      <SectionHeader title="Próxima consulta" />
      {nextAppointment ? (
        <Card
          onPress={() =>
            router.push({ pathname: '/appointments/[id]', params: { id: String(nextAppointment.id) } })
          }
        >
          <Text variant="heading">{appointmentTypeLabels[nextAppointment.type]}</Text>
          <Text>{formatDateTime(nextAppointment.datetime)}</Text>
          {nextAppointment.professional && <Text variant="caption">{nextAppointment.professional}</Text>}
        </Card>
      ) : (
        <EmptyState message="Nenhuma consulta agendada." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  capitalize: { textTransform: 'capitalize' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  taken: { color: colors.success, fontWeight: '600' },
  action: { marginTop: spacing.sm },
});
