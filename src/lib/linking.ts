import * as Linking from "expo-linking";
import { Platform, Share } from "react-native";

export const APP_DOMAIN = process.env.EXPO_PUBLIC_APP_DOMAIN || "bazmly.uz";

/** Ulashish uchun universal link (ilova o'rnatilmagan bo'lsa sayt ochiladi) */
export function webUrl(path: string): string {
  return `https://${APP_DOMAIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function shareLink(message: string, path: string) {
  const url = webUrl(path);
  try {
    await Share.share(Platform.OS === "ios" ? { message, url } : { message: `${message}\n${url}` });
  } catch {
    /* foydalanuvchi bekor qildi */
  }
}

/**
 * Skanerlangan QR / tashqi havola → ilova ichidagi yo'l.
 * Qo'llab-quvvatlanadi: bazmly://venue/12, https://bazmly.uz/hall/3, /ticket/101, /invite/abc
 */
export function internalPathFromUrl(raw: string): string | null {
  const text = raw.trim();
  let path: string | null = null;
  if (text.startsWith("bazmly://")) path = "/" + text.slice("bazmly://".length);
  else if (/^https?:\/\//i.test(text)) {
    try {
      const u = new URL(text);
      if (u.hostname === APP_DOMAIN || u.hostname === `www.${APP_DOMAIN}`) path = u.pathname;
    } catch {
      return null;
    }
  } else if (text.startsWith("/")) path = text;
  if (!path) return null;
  const ok = /^\/(venue|hall|ticket|invite|toyxona|booking)\/[\w-]+\/?$/.test(path);
  if (!ok) return null;
  // web eski yo'llari
  return path
    .replace(/^\/toyxona\//, "/hall/")
    .replace(/^\/booking\//, "/venue/")
    .replace(/\/$/, "");
}

export async function openDirections(
  lat: number,
  lng: number,
  label: string,
  app: "google" | "yandex" | "apple",
) {
  const q = encodeURIComponent(label);
  const urls: Record<typeof app, string> = {
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    yandex: `yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lng}`,
    apple: `http://maps.apple.com/?daddr=${lat},${lng}&q=${q}`,
  };
  const url = urls[app];
  if (app === "yandex") {
    const can = await Linking.canOpenURL(url).catch(() => false);
    if (!can) return Linking.openURL(`https://yandex.uz/maps/?rtext=~${lat},${lng}&rtt=auto`);
  }
  return Linking.openURL(url);
}

export function callPhone(phone: string) {
  return Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`);
}
