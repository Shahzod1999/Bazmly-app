/**
 * Bazmly dizayn tokenlari — web `globals.css` asosida.
 * Brend rangini almashtirish uchun faqat `brand` ni o'zgartiring
 * (brend kitobda #E85102 ham uchraydi).
 */
export const brand = {
  primary: "#FF6B00",
  primaryPressed: "#E05E00",
  primarySoft: "rgba(255,107,0,0.12)",
} as const;

export interface ThemeColors {
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  background: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
  overlay: string;
  skeleton: string;
  tabBar: string;
}

export const lightColors: ThemeColors = {
  ...brand,
  onPrimary: "#FFFFFF",
  background: "#FFFFFF",
  surface: "#F8F9FA",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#171717",
  textMuted: "#6B7280",
  textSubtle: "#9CA3AF",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  info: "#2563EB",
  infoSoft: "#DBEAFE",
  overlay: "rgba(0,0,0,0.45)",
  skeleton: "#EEF0F2",
  tabBar: "#FFFFFF",
};

export const darkColors: ThemeColors = {
  ...brand,
  primarySoft: "rgba(255,107,0,0.18)",
  onPrimary: "#FFFFFF",
  background: "#121212",
  surface: "#1A1A1A",
  card: "#1E1E1E",
  border: "#2A2A2A",
  text: "#F3F4F6",
  textMuted: "#A1A1AA",
  textSubtle: "#71717A",
  success: "#22C55E",
  successSoft: "rgba(34,197,94,0.16)",
  danger: "#F87171",
  dangerSoft: "rgba(248,113,113,0.16)",
  warning: "#FBBF24",
  warningSoft: "rgba(251,191,36,0.16)",
  info: "#60A5FA",
  infoSoft: "rgba(96,165,250,0.16)",
  overlay: "rgba(0,0,0,0.6)",
  skeleton: "#262626",
  tabBar: "#1A1A1A",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, pill: 999 } as const;

export const fonts = {
  light: "PlusJakartaSans_300Light",
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
} as const;

export const typography = {
  display: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34 },
  h1: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28 },
  h2: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 },
  h3: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  smallMedium: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 },
  button: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Planshetda kontent kengligi chegarasi */
export const MAX_CONTENT_WIDTH = 560;
