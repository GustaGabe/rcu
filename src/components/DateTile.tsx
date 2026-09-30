import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StyleSheet, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';

import { Text } from './Text';

interface DateTileProps {
  /** Data ISO (`yyyy-MM-dd` ou com hora). */
  date: string;
  /** Destaque para compromissos futuros. */
  highlighted?: boolean;
  size?: 'md' | 'lg';
}

/** Folhinha de calendário: dia grande, mês abreviado. */
export function DateTile({ date, highlighted = false, size = 'md' }: DateTileProps) {
  const parsed = parseISO(date);
  const large = size === 'lg';

  return (
    <View
      style={[
        styles.tile,
        large ? styles.lg : styles.md,
        { backgroundColor: highlighted ? colors.plum : colors.surfaceSunken },
      ]}
    >
      <Text color={highlighted ? colors.lavender : colors.inkSoft} style={[styles.month, large && styles.monthLg]}>
        {format(parsed, 'MMM', { locale: ptBR }).replace('.', '')}
      </Text>
      <Text color={highlighted ? colors.onPlum : colors.ink} style={[styles.day, large && styles.dayLg]}>
        {format(parsed, 'd')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, alignSelf: 'center' },
  md: { width: 52, height: 56 },
  lg: { width: 68, height: 74, borderRadius: radius.md },
  month: { fontFamily: fonts.bodySemibold, fontSize: 12, lineHeight: 14 },
  monthLg: { fontSize: 13, lineHeight: 16 },
  day: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26 },
  dayLg: { fontSize: 30, lineHeight: 34 },
});
