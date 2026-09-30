import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { InfoRow } from '@/components/InfoRow';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { formatDateTime } from '@/domain/dates';
import { appointmentTypeLabels } from '@/domain/labels';
import type { DoctorQuestion } from '@/domain/types';
import { appointments, doctorQuestions } from '@/mocks/data';
import { colors, spacing } from '@/theme';

export default function AppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointment = appointments.find((a) => String(a.id) === id);
  const [questions, setQuestions] = useState<DoctorQuestion[]>(() =>
    doctorQuestions.filter((q) => String(q.appointmentId) === id),
  );

  if (!appointment) {
    return (
      <Screen>
        <EmptyState message="Consulta não encontrada." />
      </Screen>
    );
  }

  // Estado só em memória por enquanto; na etapa 6 grava em doctor_questions.
  function toggleAsked(questionId: number) {
    setQuestions((current) => current.map((q) => (q.id === questionId ? { ...q, asked: !q.asked } : q)));
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: appointmentTypeLabels[appointment.type] }} />
      <Card>
        <InfoRow label="Data" value={formatDateTime(appointment.datetime)} />
        <InfoRow label="Profissional" value={appointment.professional ?? '—'} />
        <InfoRow label="Local" value={appointment.location ?? '—'} />
      </Card>

      {appointment.notes && (
        <Card>
          <Text>{appointment.notes}</Text>
        </Card>
      )}

      <SectionHeader title="Lembretes" />
      <Card>
        <InfoRow label="1 dia antes" value={appointment.remind1d ? 'Sim' : 'Não'} />
        <InfoRow label="2 horas antes" value={appointment.remind2h ? 'Sim' : 'Não'} />
      </Card>

      <SectionHeader title="Perguntas para o médico" />
      {questions.length === 0 ? (
        <EmptyState message="Nenhuma pergunta anotada para esta consulta." />
      ) : (
        questions.map((q) => (
          <Card key={q.id}>
            <Pressable
              onPress={() => toggleAsked(q.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: q.asked }}
              style={styles.question}
            >
              <Ionicons
                name={q.asked ? 'checkbox' : 'square-outline'}
                size={22}
                color={q.asked ? colors.success : colors.textMuted}
              />
              <View style={styles.flex}>
                <Text>{q.question}</Text>
                {q.answer && <Text variant="caption">Resposta: {q.answer}</Text>}
              </View>
            </Pressable>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  question: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
});
