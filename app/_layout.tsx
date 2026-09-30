import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { DATABASE_NAME, initDatabase, useDb } from '@/db/client';
import { configureNotifications, rescheduleAll } from '@/notifications/scheduler';
import { colors, fonts } from '@/theme';

SplashScreen.preventAutoHideAsync();
configureNotifications();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
  });

  if (!loaded && !error) return null;

  // O provider abre o banco e roda as migrações antes de montar as telas.
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
      <HideSplashWhenReady />
      {Platform.OS !== 'web' && <NotificationsBridge />}
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.violet,
          headerTitleStyle: { fontFamily: fonts.displaySemibold, fontSize: 18, color: colors.ink },
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.canvas },
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="meds/[id]" options={{ title: '' }} />
        <Stack.Screen name="meds/form" options={{ presentation: 'modal', title: 'Remédio' }} />
        <Stack.Screen name="diary/[date]" options={{ title: 'Registro do dia' }} />
        <Stack.Screen name="appointments/[id]" options={{ title: '' }} />
        <Stack.Screen name="appointments/form" options={{ presentation: 'modal', title: 'Consulta' }} />
      </Stack>
    </SQLiteProvider>
  );
}

/** Montado só quando fontes e banco estão prontos: aí a splash pode sair. */
function HideSplashWhenReady() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return null;
}

/**
 * Mantém os lembretes em dia: reagenda ao abrir o app e sempre que ele volta ao primeiro plano
 * (a janela de lembretes avança, e a permissão pode ter mudado nos Ajustes).
 * Tocar num lembrete abre a tela indicada em `data.url`.
 */
function NotificationsBridge() {
  const db = useDb();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    rescheduleAll(db);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') rescheduleAll(db);
    });
    return () => subscription.remove();
  }, [db]);

  useEffect(() => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const url = response.notification.request.content.data?.url;
    if (typeof url === 'string' && url !== '/') router.push(url as never);
    Notifications.clearLastNotificationResponse();
  }, [response]);

  return null;
}
