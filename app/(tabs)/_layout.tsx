import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { FloatingTabBar } from '@/components/FloatingTabBar';
import { colors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Ícone vazado quando inativo, preenchido quando ativo. */
function tabIcon(outline: IconName, filled: IconName) {
  return function TabIcon({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) {
    return <Ionicons name={focused ? filled : outline} color={color} size={size} />;
  };
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.canvas } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hoje', tabBarIcon: tabIcon('sunny-outline', 'sunny') }} />
      <Tabs.Screen name="meds" options={{ title: 'Remédios', tabBarIcon: tabIcon('medkit-outline', 'medkit') }} />
      <Tabs.Screen name="diary" options={{ title: 'Diário', tabBarIcon: tabIcon('book-outline', 'book') }} />
      <Tabs.Screen
        name="appointments"
        options={{ title: 'Consultas', tabBarIcon: tabIcon('calendar-outline', 'calendar') }}
      />
    </Tabs>
  );
}
