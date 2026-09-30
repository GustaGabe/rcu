import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { colors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color} size={size} />;
  };
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerTitleStyle: { color: colors.text },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hoje', tabBarIcon: tabIcon('today-outline') }} />
      <Tabs.Screen name="meds" options={{ title: 'Remédios', tabBarIcon: tabIcon('medkit-outline') }} />
      <Tabs.Screen name="diary" options={{ title: 'Diário', tabBarIcon: tabIcon('book-outline') }} />
      <Tabs.Screen
        name="appointments"
        options={{ title: 'Consultas', tabBarIcon: tabIcon('calendar-outline') }}
      />
    </Tabs>
  );
}
