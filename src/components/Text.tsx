import type { ReactNode } from 'react';
import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';

import { typography } from '@/theme';

interface TextProps {
  children: ReactNode;
  variant?: keyof typeof typography;
  style?: StyleProp<TextStyle>;
}

export function Text({ children, variant = 'body', style }: TextProps) {
  return <RNText style={[typography[variant], style]}>{children}</RNText>;
}
