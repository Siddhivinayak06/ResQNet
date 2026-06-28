import { StyleSheet, TextStyle } from 'react-native';
import { colors, spacing, radius, fontSize } from './colors';

/**
 * Premium typography styles for mobile.
 */
export const typography = StyleSheet.create({
  // ─── Display & Headings ──────────────────────────
  display: { color: colors.white, fontSize: fontSize['3xl'], fontWeight: '900', letterSpacing: -1 } as TextStyle,
  h1: { color: colors.white, fontSize: fontSize['2xl'], fontWeight: '800', letterSpacing: -0.5 } as TextStyle,
  h2: { color: colors.white, fontSize: fontSize.xl, fontWeight: '700' } as TextStyle,
  h3: { color: colors.white, fontSize: fontSize.lg, fontWeight: '600' } as TextStyle,
  h4: { color: colors.white, fontSize: fontSize.base, fontWeight: '600' } as TextStyle,

  // ─── Body ──────────────────────────────────────
  body: { color: colors.dark200, fontSize: fontSize.base, lineHeight: 24 } as TextStyle,
  bodySmall: { color: colors.dark300, fontSize: fontSize.sm, lineHeight: 20 } as TextStyle,
  caption: { color: colors.dark400, fontSize: fontSize.xs, letterSpacing: 0.2 } as TextStyle,

  // ─── Labels & Specific ─────────────────────────
  label: { color: colors.dark300, fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.sm } as TextStyle,
  sectionTitle: { color: colors.white, fontSize: fontSize.lg, fontWeight: '700', letterSpacing: 0.5 } as TextStyle,
});

/**
 * Shared component styles for consistency.
 */
export const shared = StyleSheet.create({
  // ─── Containers ────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: colors.dark950,
  },
  screenPadded: {
    flex: 1,
    backgroundColor: colors.dark950,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark950,
  },

  // ─── Cards (Floating style) ────────────────────
  card: {
    backgroundColor: colors.dark900,
    borderWidth: 1,
    borderColor: colors.dark800,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardSmall: {
    backgroundColor: colors.dark900,
    borderWidth: 1,
    borderColor: colors.dark800,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  cardGlass: {
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: colors.glassLight,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },

  // ─── Inputs ────────────────────────────────────
  input: {
    backgroundColor: colors.dark900,
    borderWidth: 1,
    borderColor: colors.dark700,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.white,
    fontSize: fontSize.base,
    marginBottom: spacing.md,
  },
  inputFocused: {
    borderColor: colors.primary500,
    backgroundColor: colors.dark800,
  },

  // ─── Buttons ───────────────────────────────────
  buttonPrimary: {
    backgroundColor: colors.primary500,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonPrimaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.base,
  },
  buttonDisabled: {
    backgroundColor: colors.dark700,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.dark600,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutlineText: {
    color: colors.dark200,
    fontWeight: '600',
    fontSize: fontSize.base,
  },

  // ─── Banners & Badges ──────────────────────────
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  errorBanner: {
    backgroundColor: colors.red900_30,
    borderWidth: 1,
    borderColor: colors.red700_50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },

  // ─── Separators ────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.dark800,
    marginVertical: spacing.md,
  },

  // ─── Effects ───────────────────────────────────
  glowRed: {
    shadowColor: colors.primary500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 16,
  },
});
