export const colors = {
  surface: '#fff8f7',
  surfaceDim: '#e7d6d6',
  surfaceBright: '#fff8f7',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#fff0f0',
  surfaceContainer: '#fceae9',
  surfaceContainerHigh: '#f6e4e4',
  surfaceContainerHighest: '#f0dfde',
  onSurface: '#221919',
  onSurfaceVariant: '#544245',
  inverseSurface: '#382e2e',
  inverseOnSurface: '#feedec',
  outline: '#867275',
  outlineVariant: '#d9c1c4',
  surfaceTint: '#984259',
  primary: '#60162e',
  onPrimary: '#ffffff',
  primaryContainer: '#7d2d44',
  onPrimaryContainer: '#ff9bb2',
  inversePrimary: '#ffb1c1',
  secondary: '#645c5e',
  onSecondary: '#ffffff',
  secondaryContainer: '#e8dddf',
  onSecondaryContainer: '#696162',
  tertiary: '#472b2c',
  onTertiary: '#ffffff',
  tertiaryContainer: '#604141',
  onTertiaryContainer: '#d8aeae',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  primaryFixed: '#ffd9df',
  primaryFixedDim: '#ffb1c1',
  onPrimaryFixed: '#3f0018',
  onPrimaryFixedVariant: '#7a2b42',
  secondaryFixed: '#ebe0e2',
  secondaryFixedDim: '#cfc4c6',
  onSecondaryFixed: '#201a1c',
  onSecondaryFixedVariant: '#4c4547',
  tertiaryFixed: '#ffdad9',
  tertiaryFixedDim: '#e7bcbc',
  onTertiaryFixed: '#2d1515',
  onTertiaryFixedVariant: '#5e3f3f',
  background: '#fff8f7',
  onBackground: '#221919',
  surfaceVariant: '#f0dfde',

  // Fallback map for legacy components to prevent crashing while refactoring
  card: '#ffffff',
  cardAlt: '#fff8f7',
  textPrimary: '#221919',
  textSecondary: '#544245',
  textMuted: '#645c5e',
  textLight: '#ffffff',
  textLink: '#7d2d44',
  borderLight: '#d9c1c4',
  borderRose: '#e8dddf',
  primaryLight: '#ffd9df',
  primaryDark: '#3f0018',
  primarySubtle: '#ffb1c1',
  accent: '#7d2d44',
  accentLight: '#FFE4E6',
  blushLight: '#FFF5F5',
  success: '#16A34A',
  successLight: '#DCFCE7',
  errorLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',
  border: '#E8E2DC',
  borderFocus: '#E11D48',
  surfaceSubtle: '#FAF6F2',
  overlay: 'rgba(28, 25, 23, 0.50)',
  midnight: '#1C1917',
};

export const typography = {
  displayLg: {
    fontFamily: 'ebGaramond',
    fontSize: 48,
    fontWeight: '500' as const,
    lineHeight: 56,
    letterSpacing: -0.96, // -0.02em of 48
  },
  headlineLg: {
    fontFamily: 'ebGaramond',
    fontSize: 32,
    fontWeight: '500' as const,
    lineHeight: 40,
  },
  headlineLgMobile: {
    fontFamily: 'ebGaramond',
    fontSize: 28,
    fontWeight: '500' as const,
    lineHeight: 36,
  },
  headlineMd: {
    fontFamily: 'ebGaramond',
    fontSize: 24,
    fontWeight: '500' as const,
    lineHeight: 32,
  },
  bodyLg: {
    fontFamily: 'manrope',
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: 'manrope',
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  labelMd: {
    fontFamily: 'manrope',
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.7, // 0.05em of 14
  },
  labelSm: {
    fontFamily: 'manrope',
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },

  // Fallback map for legacy components
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    hero: 48,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  fonts: {
    serif: 'ebGaramond',
    sans: 'manrope',
  }
};

export const radii = {
  xs: 6,
  sm: 4,      // 0.25rem
  DEFAULT: 8, // 0.5rem
  md: 12,     // 0.75rem
  lg: 16,     // 1rem
  xl: 24,     // 1.5rem
  full: 9999,
};

export const spacing = {
  unit: 4,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
  gutter: 16,
  marginMobile: 20,
};

export const shadows = {
  sm: {
    shadowColor: '#60162e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#60162e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#60162e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  glowRose: {
    shadowColor: '#7d2d44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
};
