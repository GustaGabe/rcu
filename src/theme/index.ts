// Roxo é a cor de conscientização das doenças inflamatórias intestinais; a paleta parte dela.
export const colors = {
  canvas: '#F4F2F8',
  surface: '#FFFFFF',
  surfaceSunken: '#ECE8F3',
  ink: '#1E1530',
  inkSoft: '#5E5670',
  line: '#E2DDEA',

  plum: '#2B1D42',
  plumRaised: '#3D2C5A',
  lavender: '#C9B6FF',
  lavenderMuted: 'rgba(201, 182, 255, 0.62)',
  onPlum: '#FFFFFF',
  onPlumSoft: 'rgba(255, 255, 255, 0.72)',

  violet: '#6A4BD8',
  violetSoft: '#EEE8FF',
  onViolet: '#FFFFFF',

  sage: '#2F8A66',
  sageSoft: '#E3F3EC',
  rose: '#D6456B',
  roseSoft: '#FCE8EE',
  amber: '#B7791F',
  amberSoft: '#FBF1DF',
} as const;

export type Tone = 'neutral' | 'violet' | 'sage' | 'rose' | 'amber';

export const tones: Record<Tone, { fg: string; bg: string }> = {
  neutral: { fg: colors.inkSoft, bg: colors.surfaceSunken },
  violet: { fg: colors.violet, bg: colors.violetSoft },
  sage: { fg: colors.sage, bg: colors.sageSoft },
  rose: { fg: colors.rose, bg: colors.roseSoft },
  amber: { fg: colors.amber, bg: colors.amberSoft },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

/** Nomes registrados em `app/_layout.tsx` com `useFonts`. */
export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displaySemibold: 'BricolageGrotesque_600SemiBold',
  body: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemibold: 'InstrumentSans_600SemiBold',
} as const;

// Fontes próprias não usam fontWeight: o peso vem da família.
export const typography = {
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.6, color: colors.ink },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 29, letterSpacing: -0.3, color: colors.ink },
  numeral: { fontFamily: fonts.displaySemibold, fontSize: 20, lineHeight: 24, color: colors.ink },
  heading: { fontFamily: fonts.bodySemibold, fontSize: 17, lineHeight: 22, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.ink },
  bodyStrong: { fontFamily: fonts.bodySemibold, fontSize: 15, lineHeight: 21, color: colors.ink },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.inkSoft },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16, color: colors.inkSoft },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Espaço livre no fim das telas com abas, para o conteúdo não ficar sob a barra flutuante. */
export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_GAP = 10;
