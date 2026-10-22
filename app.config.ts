import type { ExpoConfig, ConfigContext } from "expo/config";

/**
 * Bazmly ilova konfiguratsiyasi.
 * Maxfiy kalitlar faqat env orqali (.env yoki EAS secrets) — repoga yozilmaydi.
 * Ro'yxat: .env.example
 */
const APP_ID = process.env.APP_BUNDLE_ID || "uz.bazmly.app";
const APP_DOMAIN = process.env.APP_DOMAIN || "bazmly.uz";
const IS_DEV = process.env.APP_VARIANT === "development";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? "Bazmly (dev)" : "Bazmly",
  slug: "bazmly",
  scheme: "bazmly",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  locales: {
    uz: "./native-locales/uz.json",
    ru: "./native-locales/ru.json",
    en: "./native-locales/en.json",
  },
  ios: {
    bundleIdentifier: IS_DEV ? `${APP_ID}.dev` : APP_ID,
    supportsTablet: true,
    buildNumber: "1",
    associatedDomains: [`applinks:${APP_DOMAIN}`],
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
      LSApplicationQueriesSchemes: ["yandexnavi", "comgooglemaps"],
      ITSAppUsesNonExemptEncryption: false,
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    package: IS_DEV ? `${APP_ID}.dev` : APP_ID,
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: "#FF6B00",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    permissions: [
      "android.permission.CAMERA",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.POST_NOTIFICATIONS",
    ],
    blockedPermissions: ["android.permission.RECORD_AUDIO"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          { scheme: "https", host: APP_DOMAIN, pathPrefix: "/venue" },
          { scheme: "https", host: APP_DOMAIN, pathPrefix: "/hall" },
          { scheme: "https", host: APP_DOMAIN, pathPrefix: "/ticket" },
          { scheme: "https", host: APP_DOMAIN, pathPrefix: "/invite" },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    // asyncRoutes web'da default yoqilgan; preview native xulqiga mos bo'lishi uchun o'chirildi
    ["expo-router", { asyncRoutes: { web: false } }],
    "expo-secure-store",
    "expo-image",
    "expo-localization",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#FF6B00",
        image: "./assets/splash-icon.png",
        imageWidth: 160,
        resizeMode: "contain",
        dark: { backgroundColor: "#121212", image: "./assets/splash-icon.png" },
      },
    ],
    "expo-font",
    [
      "expo-camera",
      {
        cameraPermission: "Bazmly chipta va bron QR kodlarini skanerlash uchun kameradan foydalanadi.",
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Bazmly sizga eng yaqin to'yxona va restoranlarni ko'rsatish uchun joylashuvingizdan foydalanadi.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Bazmly profil rasmi va muassasa suratlarini yuklash uchun galereyangizga kiradi.",
        cameraPermission: "Bazmly muassasa suratlarini olish uchun kameradan foydalanadi.",
        microphonePermission: false,
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#FF6B00",
        defaultChannel: "bookings",
      },
    ],
    [
      "react-native-maps",
      {
        iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_KEY,
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_KEY,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appDomain: APP_DOMAIN,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
