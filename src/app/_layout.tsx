import "../i18n";
import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import * as Notifications from "expo-notifications";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";
import { queryClient } from "../api/queries";
import { useAuth } from "../stores/auth";
import { usePrefs } from "../stores/prefs";
import { DialogHost, OfflineBanner, ToastHost } from "../components/ui";
import { ensureAndroidChannels, registerDevice, routeFromNotificationData } from "../lib/push";

export { ErrorBoundary } from "../components/AppErrorBoundary";

// Deep link bilan ochilgan sahifada "orqaga" bosilsa bosh sahifaga qaytadi
export const unstable_settings = { anchor: "(tabs)" };

void SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { colors, isDark } = useTheme();
  const status = useAuth((s) => s.status);
  const router = useRouter();
  const segments = useSegments();
  const onboardingDone = usePrefs((s) => s.onboardingDone);

  // Birinchi ochilishda onboarding (til tanlash). Deep link bo'lsa ham avval onboarding.
  useEffect(() => {
    const inOnboarding = segments[0] === "onboarding";
    if (!onboardingDone && !inOnboarding) router.replace("/onboarding");
  }, [onboardingDone, segments, router]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  // Kirgan foydalanuvchi uchun qurilmani ro'yxatdan o'tkazish (push token bo'lsa — u bilan)
  useEffect(() => {
    if (status === "authed") void registerDevice();
  }, [status]);

  // Push bosilganda tegishli ekranga o'tish
  useEffect(() => {
    if (Platform.OS === "web") return;
    void ensureAndroidChannels();
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const path = routeFromNotificationData(
        resp.notification.request.content.data as Record<string, unknown>,
      );
      if (path) router.push(path as never);
    });
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      const path = routeFromNotificationData(
        last.notification.request.content.data as Record<string, unknown>,
      );
      if (path) setTimeout(() => router.push(path as never), 400);
      Notifications.clearLastNotificationResponse();
    }
    return () => sub.remove();
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        {/* Onboarding tekshiruvi yuqoridagi useEffect'da. Stack.Protected ishlatilmadi: yopilganda
            router birinchi ochiq statik sahifaga (masalan /map) o'tib ketardi. */}
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="scan"
          options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="partner" options={{ animation: "fade" }} />
      </Stack>
      <OfflineBanner />
      <ToastHost />
      <DialogHost />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    // Kirill (rus tili) uchun — Plus Jakarta Sans kirillni qo'llamaydi
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const bootstrap = useAuth((s) => s.bootstrap);
  const status = useAuth((s) => s.status);
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    void bootstrap().finally(() => setBootDone(true));
  }, [bootstrap]);

  const ready = (fontsLoaded || !!fontError) && bootDone && status !== "booting";

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
