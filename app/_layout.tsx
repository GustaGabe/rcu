import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { DATABASE_NAME, initDatabase } from '@/db/client';
import { colors, fonts } from '@/theme';

SplashScreen.preventAutoHideAsync();

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
        <Stack.Screen name="diary/[date]" options={{ title: 'Registro do dia' }} />
        <Stack.Screen name="appointments/[id]" options={{ title: '' }} />
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
