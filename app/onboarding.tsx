import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ProgressRing } from '@/components/ProgressRing';
import { Text } from '@/components/Text';
import { useOnboarding } from '@/hooks/useOnboarding';
import { colors, fonts, radius, spacing } from '@/theme';

interface Page {
  title: string;
  body: string;
  illustration: ReactNode;
}

const pages: Page[] = [
  {
    title: 'Seu tratamento, um dia de cada vez',
    body: 'Remédios na hora certa, sintomas registrados em menos de 30 segundos e consultas sem esquecer nada.',
    illustration: <TodayIllustration />,
  },
  {
    title: 'Tudo fica no seu celular',
    body: 'Sem conta, sem servidor e sem anúncios. O app não envia seus dados de saúde para lugar nenhum.',
    illustration: <PrivacyIllustration />,
  },
  {
    title: 'Um diário para levar à consulta',
    body: 'Registre como está, marque as crises e anote perguntas para o médico. Na consulta, o último mês está na palma da mão.',
    illustration: <DiaryIllustration />,
  },
  {
    title: 'Quem orienta é o seu médico',
    body: 'O App RCU organiza informações. Ele não recomenda doses nem faz diagnósticos: siga sempre a orientação da sua equipe de saúde.',
    illustration: <CareIllustration />,
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { complete } = useOnboarding();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const [page, setPage] = useState(0);
  const last = page === pages.length - 1;

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });

  function goTo(index: number) {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setPage(index);
  }

  async function finish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await complete();
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      <View style={styles.topBar}>
        {!last && (
          <Pressable onPress={() => goTo(pages.length - 1)} hitSlop={12} accessibilityRole="button">
            <Text color={colors.lavenderMuted} variant="bodyStrong">
              Pular
            </Text>
          </Pressable>
        )}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={styles.pager}
      >
        {pages.map((p, index) => (
          <PageView key={p.title} page={p} index={index} width={width} scrollX={scrollX} />
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityLabel={`Página ${page + 1} de ${pages.length}`}>
          {pages.map((p, index) => (
            <Dot key={p.title} index={index} width={width} scrollX={scrollX} />
          ))}
        </View>
        <Button
          variant="onPlum"
          title={last ? 'Começar a usar' : 'Continuar'}
          onPress={last ? finish : () => goTo(page + 1)}
        />
      </View>
    </View>
  );
}

interface PageViewProps {
  page: Page;
  index: number;
  width: number;
  scrollX: SharedValue<number>;
}

function PageView({ page, index, width, scrollX }: PageViewProps) {
  const range = [(index - 1) * width, index * width, (index + 1) * width];

  // Parallax: a ilustração anda mais devagar que o texto e esmaece nas bordas.
  const artStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.get(), range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(scrollX.get(), range, [width * 0.35, 0, -width * 0.35], Extrapolation.CLAMP) },
      { scale: interpolate(scrollX.get(), range, [0.85, 1, 0.85], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={[styles.page, { width }]}>
      <Animated.View style={[styles.art, artStyle]}>{page.illustration}</Animated.View>
      <View style={styles.copy}>
        <Text variant="display" color={colors.onPlum}>
          {page.title}
        </Text>
        <Text color={colors.onPlumSoft} style={styles.body}>
          {page.body}
        </Text>
      </View>
    </View>
  );
}

function Dot({ index, width, scrollX }: { index: number; width: number; scrollX: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const range = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(scrollX.get(), range, [8, 28, 8], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.get(), range, [0.35, 1, 0.35], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

/* Ilustrações: montadas com os mesmos elementos do app, em versão para o fundo escuro. */

function TodayIllustration() {
  return (
    <View style={styles.center}>
      <ProgressRing progress={2 / 3} size={168} strokeWidth={16} color={colors.lavender} trackColor={colors.plumRaised}>
        <Text color={colors.onPlum} style={styles.ringValue}>
          2/3
        </Text>
        <Text color={colors.onPlumSoft} variant="label">
          doses
        </Text>
      </ProgressRing>
      <View style={[styles.floating, styles.floatLeft]}>
        <View style={[styles.miniNode, { backgroundColor: colors.sage }]}>
          <Ionicons name="checkmark" size={12} color={colors.onPlum} />
        </View>
        <Text style={styles.floatText}>08:00</Text>
      </View>
      <View style={[styles.floating, styles.floatRight]}>
        <View style={[styles.miniNode, styles.miniPending]} />
        <Text style={styles.floatText}>20:00</Text>
      </View>
    </View>
  );
}

function PrivacyIllustration() {
  const orbit: { icon: 'medkit' | 'book' | 'calendar'; style: object }[] = [
    { icon: 'medkit', style: { top: 6, left: 14 } },
    { icon: 'book', style: { top: 36, right: 0 } },
    { icon: 'calendar', style: { bottom: 8, left: 28 } },
  ];
  return (
    <View style={styles.center}>
      <View style={styles.bigCircle}>
        <Ionicons name="phone-portrait-outline" size={84} color={colors.lavender} />
        <View style={styles.lock}>
          <Ionicons name="lock-closed" size={20} color={colors.plum} />
        </View>
      </View>
      {orbit.map((o) => (
        <View key={o.icon} style={[styles.orbit, o.style]}>
          <Ionicons name={o.icon} size={20} color={colors.lavender} />
        </View>
      ))}
    </View>
  );
}

function DiaryIllustration() {
  const days = ['e', 'e', '-', 'e', 'c', 'c', 'c', 'e', 'e', 'e', '-', 'e', 'e', 't'];
  return (
    <View style={styles.card}>
      <Text color={colors.onPlum} variant="heading">
        Últimos 14 dias
      </Text>
      <View style={styles.strip}>
        {days.map((d, i) => (
          <View
            key={i}
            style={[
              styles.stripDot,
              d === 'e' && { backgroundColor: colors.lavender },
              d === 'c' && { backgroundColor: colors.rose },
              d === 't' && styles.stripToday,
            ]}
          />
        ))}
      </View>
      {[
        { label: 'Dor', value: 3, max: 10 },
        { label: 'Urgência', value: 1, max: 3 },
      ].map((m) => (
        <View key={m.label} style={styles.metric}>
          <Text color={colors.onPlumSoft} variant="label" style={styles.metricLabel}>
            {m.label}
          </Text>
          <View style={styles.segments}>
            {Array.from({ length: m.max }, (_, i) => (
              <View key={i} style={[styles.segment, i < m.value && { backgroundColor: colors.lavender }]} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function CareIllustration() {
  return (
    <View style={styles.center}>
      <View style={styles.bigCircle}>
        <MaterialCommunityIcons name="stethoscope" size={88} color={colors.lavender} />
      </View>
      <View style={[styles.floating, styles.careChip]}>
        <Ionicons name="chatbubble-ellipses" size={16} color={colors.lavender} />
        <Text style={styles.floatText}>3 perguntas anotadas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.plum },
  topBar: { height: 44, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: spacing.xl },
  pager: { flex: 1 },
  page: { flex: 1, paddingHorizontal: spacing.xl },
  art: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: spacing.md, paddingBottom: spacing.xl },
  body: { fontSize: 17, lineHeight: 25 },
  footer: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 8, borderRadius: 4, backgroundColor: colors.lavender },

  center: { width: 260, height: 240, alignItems: 'center', justifyContent: 'center' },
  ringValue: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40 },
  floating: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.plumRaised,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  floatLeft: { left: -8, top: 18, transform: [{ rotate: '-6deg' }] },
  floatRight: { right: -8, bottom: 22, transform: [{ rotate: '5deg' }] },
  floatText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.onPlum },
  miniNode: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  miniPending: { borderWidth: 2.5, borderColor: colors.lavender },

  bigCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.plumRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lock: {
    position: 'absolute',
    right: 22,
    bottom: 22,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.plumRaised,
  },
  orbit: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.plumRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  careChip: { bottom: 4, transform: [{ rotate: '-3deg' }] },

  card: {
    width: 290,
    backgroundColor: colors.plumRaised,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  strip: { flexDirection: 'row', justifyContent: 'space-between' },
  stripDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255, 255, 255, 0.12)' },
  stripToday: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.lavender },
  metric: { gap: 6 },
  metricLabel: { fontSize: 12 },
  segments: { flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.12)' },
});
