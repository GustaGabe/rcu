import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors, fonts, radius } from '@/theme';

import { Text } from './Text';

export interface Segment<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}

const PADDING = 4;

export function SegmentedControl<T extends string>({ segments, value, onChange }: SegmentedControlProps<T>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    segments.findIndex((s) => s.value === value),
    0,
  );
  const segmentWidth = width > 0 ? (width - PADDING * 2) / segments.length : 0;
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.set(withSpring(index * segmentWidth, { damping: 22, stiffness: 260 }));
  }, [index, segmentWidth, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.get() }] }));

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  return (
    <View style={styles.track} onLayout={onLayout} accessibilityRole="tablist">
      {segmentWidth > 0 && <Animated.View style={[styles.indicator, { width: segmentWidth }, indicatorStyle]} />}
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync();
              onChange(segment.value);
            }}
          >
            <Text color={selected ? colors.ink : colors.inkSoft} style={styles.label}>
              {segment.label}
            </Text>
            {segment.count !== undefined && (
              <Text color={selected ? colors.violet : colors.inkSoft} style={styles.count}>
                {segment.count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.pill,
    padding: PADDING,
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    shadowColor: colors.plum,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
  },
  label: { fontFamily: fonts.bodySemibold, fontSize: 14 },
  count: { fontFamily: fonts.displaySemibold, fontSize: 13 },
});
