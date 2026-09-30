import type { ReactNode } from 'react';
import { Pressable as RNPressable, type AccessibilityRole, type AccessibilityState, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

interface PressableProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
  /** Quanto o elemento encolhe ao ser tocado. */
  pressedScale?: number;
}

/** Pressable que encolhe levemente ao toque, como resposta física à ação. */
export function Pressable({
  children,
  onPress,
  disabled,
  style,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityState,
  pressedScale = 0.97,
}: PressableProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.set(withSpring(pressedScale, { damping: 20, stiffness: 400 }));
      }}
      onPressOut={() => {
        scale.set(withSpring(1, { damping: 14, stiffness: 300 }));
      }}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
