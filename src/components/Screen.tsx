import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, TAB_BAR_GAP, TAB_BAR_HEIGHT } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** Telas das abas: sem header nativo e com a barra flutuante por cima do fim da tela. */
  tab?: boolean;
}

export function Screen({ children, tab = false }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        tab && {
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + TAB_BAR_HEIGHT + TAB_BAR_GAP + spacing.xl,
        },
      ]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.lg },
});
