import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { darkColors, lightColors, type ThemeColors } from "./tokens";
import { usePrefs } from "../stores/prefs";

interface ThemeCtx {
  colors: ThemeColors;
  isDark: boolean;
}

const Ctx = createContext<ThemeCtx>({ colors: lightColors, isDark: false });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pref = usePrefs((s) => s.theme);
  const system = useColorScheme();
  const isDark = pref === "dark" || (pref === "system" && system === "dark");
  const value = useMemo(() => ({ colors: isDark ? darkColors : lightColors, isDark }), [isDark]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}

/** Mavzuga bog'liq StyleSheet yaratish uchun yordamchi */
export function useThemedStyles<T>(factory: (c: ThemeColors, isDark: boolean) => T): T {
  const { colors, isDark } = useTheme();
  return useMemo(() => factory(colors, isDark), [colors, isDark, factory]);
}
