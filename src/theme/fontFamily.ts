import { useTranslation } from "react-i18next";

/**
 * Plus Jakarta Sans kirill harflarini qo'llamaydi. Rus tilida xuddi shu og'irlikdagi
 * Inter shriftiga almashtiriladi (React Native'da shrift "fallback" zanjiri yo'q).
 */
const CYRILLIC_MAP: Record<string, string> = {
  PlusJakartaSans_300Light: "Inter_300Light",
  PlusJakartaSans_400Regular: "Inter_400Regular",
  PlusJakartaSans_500Medium: "Inter_500Medium",
  PlusJakartaSans_600SemiBold: "Inter_600SemiBold",
  PlusJakartaSans_700Bold: "Inter_700Bold",
  PlusJakartaSans_800ExtraBold: "Inter_800ExtraBold",
};

const CYRILLIC_LANGS = new Set(["ru"]);

export function resolveFont(family: string, lang: string | undefined): string {
  if (lang && CYRILLIC_LANGS.has(lang)) return CYRILLIC_MAP[family] ?? family;
  return family;
}

/** Til o'zgarganda qayta render bo'ladi */
export function useFont(family: string): string {
  const { i18n } = useTranslation();
  return resolveFont(family, i18n.language);
}
