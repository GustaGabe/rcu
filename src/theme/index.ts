export const colors = {
  background: '#F6F7F9',
  surface: '#FFFFFF',
  text: '#1B1F24',
  textMuted: '#5B6470',
  border: '#E3E6EA',
  primary: '#2F6F8F',
  onPrimary: '#FFFFFF',
  primarySoft: '#E6F0F5',
  success: '#2E7D5B',
  warning: '#B7791F',
  danger: '#B42318',
  flare: '#FDECEC',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  heading: { fontSize: 17, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
} as const;
