import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import { colors } from '@/theme';

import { Pressable } from './Pressable';

interface IconButtonProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel: string;
  onPress: () => void;
}

export function IconButton({ icon, accessibilityLabel, onPress }: IconButtonProps) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel} pressedScale={0.9} style={styles.button}>
      <Ionicons name={icon} size={24} color={colors.onViolet} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
