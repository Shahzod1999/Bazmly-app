import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { userService } from "../api";
import { kv } from "./storage";

/**
 * Push bildirishnomalar.
 * - Ruxsat erta so'ralmaydi: birinchi muvaffaqiyatli brondan keyin (`maybeAskPushAfterBooking`)
 *   yoki profil sozlamalaridan.
 * - Token `POST /users/me/devices` ga yuboriladi.
 * - Token turi: EXPO_PUBLIC_PUSH_TOKEN_KIND=expo (default) | native (FCM/APNs).
 */

const DEVICE_UUID_KEY = "device_uuid";
const TOKEN_KIND = process.env.EXPO_PUBLIC_PUSH_TOKEN_KIND === "native" ? "native" : "expo";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function ensureAndroidChannels() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("bookings", {
    name: "Bronlar",
    // eslint-disable-next-line import/namespace -- enum `export *` orqali eksport qilingan, tsc tasdiqlaydi
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: "#FF6B00",
    vibrationPattern: [0, 200, 120, 200],
  });
  await Notifications.setNotificationChannelAsync("promotions", {
    name: "Aksiyalar",
    // eslint-disable-next-line import/namespace -- yuqoridagi izoh
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export function getDeviceUuid(): string {
  let id = kv.getString(DEVICE_UUID_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
    kv.set(DEVICE_UUID_KEY, id);
  }
  return id;
}

export async function getPushPermissionStatus(): Promise<"granted" | "denied" | "undetermined"> {
  if (Platform.OS === "web") return "denied";
  const { status } = await Notifications.getPermissionsAsync();
  return status as "granted" | "denied" | "undetermined";
}

async function getToken(): Promise<string | null> {
  if (!Device.isDevice) return null; // simulyatorda push token olinmaydi
  try {
    if (TOKEN_KIND === "native") {
      const t = await Notifications.getDevicePushTokenAsync();
      return typeof t.data === "string" ? t.data : JSON.stringify(t.data);
    }
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) {
      if (__DEV__) console.warn("EAS projectId yo'q — Expo push token olinmadi (eas init qiling)");
      return null;
    }
    const t = await Notifications.getExpoPushTokenAsync({ projectId });
    return t.data;
  } catch (e) {
    if (__DEV__) console.warn("Push token olinmadi", e);
    return null;
  }
}

/** Qurilmani backend'da ro'yxatdan o'tkazadi (push token bo'lsa — u bilan). */
export async function registerDevice(): Promise<void> {
  if (Platform.OS === "web") return;
  const status = await getPushPermissionStatus();
  const push_token = status === "granted" ? await getToken() : null;
  try {
    await userService.registerDevice({
      device_uuid: getDeviceUuid(),
      platform: Platform.OS === "ios" ? "ios" : "android",
      app_version: Application.nativeApplicationVersion ?? "1.0.0",
      push_token,
    });
  } catch (e) {
    if (__DEV__) console.warn("Device ro'yxatdan o'tmadi", e);
  }
}

/** Ruxsat so'raydi va tokenni yuboradi. Natija: ruxsat berildimi */
export async function requestPushPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  await ensureAndroidChannels();
  const { status } = await Notifications.requestPermissionsAsync();
  const granted = status === "granted";
  if (granted) await registerDevice();
  return granted;
}

/** Logout'da: tokensiz qayta ro'yxatdan o'tkazamiz (backend'da token o'chadi) */
export async function unregisterPushToken(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await userService.registerDevice({
      device_uuid: getDeviceUuid(),
      platform: Platform.OS === "ios" ? "ios" : "android",
      app_version: Application.nativeApplicationVersion ?? "1.0.0",
      push_token: null,
    });
  } catch {
    /* ignore */
  }
}

export { routeFromNotificationData } from "./pushRoute";
