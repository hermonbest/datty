export const colors = {
  // Primary brand palette - Romantic Red & Velvet Crimson
  primary: '#E11D48',         // Rose 600 - Radiant romantic crimson
  primaryDark: '#BE123C',     // Rose 700 - Deep ruby red
  primaryDeep: '#881337',     // Rose 900 - Velvet wine red
  primaryLight: '#FFE4E6',    // Rose 100 - Soft rose petal blush
  primarySubtle: '#FFF1F2',   // Rose 50 - Light rose glow
  primaryMuted: 'rgba(225, 29, 72, 0.12)',

  // Secondary & Accent - Warm Coral Rose & Champagne Gold
  accent: '#F43F5E',          // Rose 500 - Coral rose
  accentLight: '#FFE4E6',
  accentWarm: '#F59E0B',      // Amber 500 - Warm candle glow
  blush: '#FDA4AF',           // Rose 300 - Tender blush
  blushLight: '#FFF5F5',      // Clean soft tinted white
  midnight: '#1C1917',        // Deep warm charcoal

  // Neutrals & Backgrounds
  background: '#FAF7F5',      // Warm soft cream background
  backgroundAlt: '#F5EFEA',   // Secondary screen background
  card: '#FFFFFF',
  cardAlt: '#F8F4F0',
  surface: '#FFFFFF',
  surfaceSubtle: '#FAF6F2',

  // Text colors
  textPrimary: '#1C1917',     // Warm dark stone (high contrast & readable)
  textSecondary: '#6A635E',   // Balanced secondary stone
  textMuted: '#9E9792',       // Subdued placeholder & muted
  textLight: '#FFFFFF',
  textLink: '#E11D48',

  // Borders & Dividers
  border: '#E8E2DC',
  borderLight: '#F3EDE7',
  borderFocus: '#E11D48',
  borderRose: '#FECDD3',

  // Status & Feedback
  success: '#16A34A',
  successLight: '#DCFCE7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // Overlay & Translucency
  overlay: 'rgba(28, 25, 23, 0.50)',
  glass: 'rgba(255, 255, 255, 0.90)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 34,
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
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  glowRose: {
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
};
