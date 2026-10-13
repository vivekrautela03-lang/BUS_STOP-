// ============================================================================
// BUS STOP — MOBILE DESIGN SYSTEM TOKENS & THEME
// Professional, mobile-first transportation design system.
// ============================================================================

export const colors = {
  // Brand Primary Palette
  primary: '#2589E8',
  primaryDark: '#1A6DBB',
  primaryLight: '#EAF5FF',
  primarySoft: '#EAF5FF',
  primaryTint: 'rgba(37, 137, 232, 0.12)',

  // Deep Navy for readable text & headers
  navy: '#142B45',
  navyDark: '#0D1E32',
  navyMuted: '#243D5C',

  // Surfaces & Backgrounds
  background: '#F8FAFC',
  card: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  lightGray: '#F1F5F9',
  border: '#DCE7F1',
  borderSubtle: '#EDF2F7',

  // Typography Colors
  textPrimary: '#142B45',
  textSecondary: '#65758B',
  secondaryText: '#65758B',
  textMuted: '#94A3B8',
  placeholder: '#94A3B8',
  textWhite: '#FFFFFF',

  // Semantic Status Colors
  success: '#10B981',
  successLight: '#ECFDF5',
  successBorder: '#A7F3D0',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  errorBorder: '#FECACA',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  warningBorder: '#FDE68A',
  info: '#0284C7',
  infoLight: '#F0F9FF',

  // Accent Transit Highlights
  sky: '#38BDF8',
  gold: '#F59E0B',
  accentGold: '#F59E0B',
  liveGreen: '#10B981',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
  round: 999,
} as const;

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    tiny: 11,
    caption: 12,
    bodySm: 13,
    body: 15,
    bodyLg: 16,
    subheading: 18,
    heading: 20,
    titleLg: 24,
    display: 32,
  },
  lineHeight: {
    caption: 16,
    bodySm: 18,
    body: 22,
    subheading: 24,
    heading: 28,
    display: 40,
  },

  // Concrete style presets for components
  display: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    lineHeight: 40,
  },
  h1: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  h3: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bodySm: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    color: colors.textSecondary,
    lineHeight: 14,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#142B45',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#142B45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#142B45',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;
