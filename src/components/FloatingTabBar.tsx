import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { Tabs } from 'expo-router';
import { useEffect, useRef, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent, type LayoutRectangle } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, TAB_BAR_GAP, TAB_BAR_HEIGHT } from '@/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const INSET = 6;
const SPRING = { damping: 20, stiffness: 220, mass: 0.9 };

/**
 * Barra de abas flutuante em vidro escuro. A aba ativa vira uma pílula lavanda
 * com ícone e nome; as outras mostram só o ícone. A pílula desliza entre as abas.
 */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const layouts = useRef<Record<number, LayoutRectangle>>({});
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const ready = useSharedValue(0);

  function moveTo(layout: LayoutRectangle, animate: boolean) {
    if (animate && ready.get()) {
      pillX.set(withSpring(layout.x, SPRING));
      pillWidth.set(withSpring(layout.width, SPRING));
    } else {
      pillX.set(layout.x);
      pillWidth.set(layout.width);
      ready.set(1);
    }
  }

  useEffect(() => {
    const layout = layouts.current[state.index];
    if (layout) moveTo(layout, true);
    // moveTo só lê shared values; não precisa ser dependência.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  function onItemLayout(index: number, e: LayoutChangeEvent) {
    layouts.current[index] = e.nativeEvent.layout;
    if (index === state.index) moveTo(e.nativeEvent.layout, true);
  }

  const pillStyle = useAnimatedStyle(() => ({
    opacity: ready.get(),
    width: pillWidth.get(),
    transform: [{ translateX: pillX.get() }],
  }));

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: Math.max(insets.bottom - 8, TAB_BAR_GAP) }]}>
      <View style={styles.shadow}>
        <BlurView intensity={40} tint="dark" style={styles.bar}>
          <View style={styles.tint} />
          <Animated.View style={[styles.pill, pillStyle]} />

          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const options = descriptors[route.key].options;
            const label = options.title ?? route.name;
            const color = focused ? colors.plum : colors.lavenderMuted;

            function onPress() {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                Haptics.selectionAsync();
                navigation.navigate(route.name, route.params);
              }
            }

            return (
              <Animated.View
                key={route.key}
                layout={LinearTransition.springify().damping(SPRING.damping).stiffness(SPRING.stiffness)}
                onLayout={(e) => onItemLayout(index, e)}
                style={focused ? styles.itemFocused : styles.item}
              >
                <Pressable
                  onPress={onPress}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={label}
                  hitSlop={6}
                  style={styles.pressable}
                >
                  {options.tabBarIcon?.({ focused, color, size: 22 })}
                  {focused && (
                    <Animated.Text
                      entering={FadeIn.duration(220).delay(60)}
                      exiting={FadeOut.duration(90)}
                      numberOfLines={1}
                      style={styles.label}
                    >
                      {label}
                    </Animated.Text>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 20, right: 20 },
  shadow: {
    borderRadius: TAB_BAR_HEIGHT / 2,
    shadowColor: colors.plum,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  bar: {
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: INSET,
  },
  tint: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(43, 29, 66, 0.86)' },
  pill: {
    position: 'absolute',
    left: 0,
    top: INSET,
    bottom: INSET,
    borderRadius: (TAB_BAR_HEIGHT - INSET * 2) / 2,
    backgroundColor: colors.lavender,
  },
  item: { height: TAB_BAR_HEIGHT - INSET * 2, width: 56 },
  itemFocused: { height: TAB_BAR_HEIGHT - INSET * 2, paddingHorizontal: 18 },
  pressable: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  label: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.plum },
});
