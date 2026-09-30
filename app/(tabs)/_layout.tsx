import Ionicons from '@expo/vector-icons/Ionicons';
import TopTabs from 'expo-router/js-top-tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { FloatingTabBar } from '@/components/FloatingTabBar';
import { colors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Ícone vazado quando inativo, preenchido quando ativo. */
function tabIcon(outline: IconName, filled: IconName) {
  return function TabIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <Ionicons name={focused ? filled : outline} color={color} size={22} />;
  };
}

/**
 * Abas num paginador nativo (react-native-tab-view + react-native-pager-view): além de tocar
 * nos ícones, arrastar para o lado troca de aba, com a tela acompanhando o dedo.
 * Todas as abas ficam montadas (`lazy: false`) para a vizinha já aparecer pronta durante o arrasto.
 */
export default function TabLayout() {
  return (
    <TopTabs
      tabBarPosition="bottom"
      tabBar={(props: ComponentProps<typeof FloatingTabBar>) => <FloatingTabBar {...props} />}
      screenOptions={{ swipeEnabled: true, lazy: false, sceneStyle: { backgroundColor: colors.canvas } }}
    >
      <TopTabs.Screen name="index" options={{ title: 'Hoje', tabBarIcon: tabIcon('sunny-outline', 'sunny') }} />
      <TopTabs.Screen name="meds" options={{ title: 'Remédios', tabBarIcon: tabIcon('medkit-outline', 'medkit') }} />
      <TopTabs.Screen name="diary" options={{ title: 'Diário', tabBarIcon: tabIcon('book-outline', 'book') }} />
      <TopTabs.Screen
        name="appointments"
        options={{ title: 'Consultas', tabBarIcon: tabIcon('calendar-outline', 'calendar') }}
      />
    </TopTabs>
  );
}
