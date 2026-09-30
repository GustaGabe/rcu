import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/theme';

// Na etapa 3 este layout também abre o banco e roda as migrações.
export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerBackTitle: 'Voltar',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="meds/[id]" options={{ title: 'Remédio' }} />
        <Stack.Screen name="diary/[date]" options={{ title: 'Registro do dia' }} />
        <Stack.Screen name="appointments/[id]" options={{ title: 'Consulta' }} />
      </Stack>
    </>
  );
}
