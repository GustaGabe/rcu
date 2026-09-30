import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** De 0 a 1. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor: string;
  children?: ReactNode;
}

export function ProgressRing({ progress, size = 88, strokeWidth = 9, color, trackColor, children }: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const animated = useSharedValue(0);

  useEffect(() => {
    animated.set(
      withTiming(Math.min(Math.max(progress, 0), 1), {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [progress, animated]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.get()),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Começa no topo, não à direita.
  svg: { transform: [{ rotate: '-90deg' }] },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
