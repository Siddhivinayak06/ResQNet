import { StyleSheet, TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Shared typography styles for consistency across all screens.
 */
export const typography = StyleSheet.create({
  // ─── Headings ──────────────────────────────────
  h1: { color: colors.white, fontSize: 30, fontWeight: 'bold' } as TextStyle,
  h2: { color: colors.white, fontSize: 24, fontWeight: 'bold' } as TextStyle,
  h3: { color: colors.white, fontSize: 20, fontWeight: 'bold' } as TextStyle,
  h4: { color: colors.white, fontSize: 18, fontWeight: '600' } as TextStyle,

  // ─── Body ──────────────────────────────────────
  body: { color: colors.dark200, fontSize: 15, lineHeight: 22 } as TextStyle,
  bodySmall: { color: colors.dark300, fontSize: 14 } as TextStyle,
  caption: { color: colors.dark400, fontSize: 12 } as TextStyle,
  tiny: { color: colors.dark500, fontSize: 10 } as TextStyle,

  // ─── Labels ────────────────────────────────────
  label: { color: colors.dark300, fontSize: 14, marginBottom: 8 } as TextStyle,
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' } as TextStyle,

  // ─── Buttons ───────────────────────────────────
  buttonPrimary: { color: colors.white, fontWeight: 'bold', fontSize: 16 } as TextStyle,
  buttonSecondary: { color: colors.primary400, fontWeight: '600', fontSize: 16 } as TextStyle,
  link: { color: colors.primary400, fontWeight: '600' } as TextStyle,
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
    paddingHorizontal: 24,
  },

  // ─── Cards ─────────────────────────────────────
  card: {
    backgroundColor: colors.dark900,
    borderWidth: 1,
    borderColor: colors.dark700,
    borderRadius: 20,
    padding: 20,
  },
  cardSmall: {
    backgroundColor: colors.dark900,
    borderWidth: 1,
    borderColor: colors.dark700,
    borderRadius: 16,
    padding: 16,
  },

  // ─── Inputs ────────────────────────────────────
  input: {
    backgroundColor: colors.dark800,
    borderWidth: 1,
    borderColor: colors.dark600,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.white,
    fontSize: 16,
    marginBottom: 16,
  },

  // ─── Buttons ───────────────────────────────────
  buttonPrimary: {
    backgroundColor: colors.primary600,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonDisabled: {
    backgroundColor: colors.primary800,
  },
  buttonOutline: {
    backgroundColor: colors.dark900,
    borderWidth: 1,
    borderColor: colors.dark700,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center' as const,
  },

  // ─── Banners ───────────────────────────────────
  errorBanner: {
    backgroundColor: colors.red900_30,
    borderWidth: 1,
    borderColor: colors.red700_50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },

  // ─── Separators ────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.dark800,
  },

  // ─── Shadows ───────────────────────────────────
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  glowRed: {
    shadowColor: colors.primary500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
});
