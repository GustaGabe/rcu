import type { ReactNode } from 'react';
import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';

import { typography, type TypographyVariant } from '@/theme';

interface TextProps {
  children: ReactNode;
  variant?: TypographyVariant;
  color?: string;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}

export function Text({ children, variant = 'body', color, numberOfLines, style }: TextProps) {
  return (
    <RNText numberOfLines={numberOfLines} style={[typography[variant], color ? { color } : null, style]}>
      {children}
    </RNText>
  );
}
