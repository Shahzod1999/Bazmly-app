import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Token saqlash.
 * - Xotirada (sync) kesh — apiFetch har so'rovda await qilmasligi uchun.
 * - Diskda expo-secure-store (iOS Keychain / Android Keystore).
 * Web (faqat dev preview) uchun SecureStore yo'q — sessionStorage'ga tushadi.
 */
const ACCESS_KEY = "bazmly_access_token";
const REFRESH_KEY = "bazmly_refresh_token";

let accessToken: string | null = null;
let refreshToken: string | null = null;

const webStore = {
  get(key: string): string | null {
    try {
      return globalThis.sessionStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) globalThis.sessionStorage?.removeItem(key);
      else globalThis.sessionStorage?.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
};

async function persist(key: string, value: string | null) {
  if (Platform.OS === "web") {
    webStore.set(key, value);
    return;
  }
  try {
    if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  } catch (e) {
    if (__DEV__) console.warn("SecureStore xatosi", e);
  }
}

/** Ilova ochilganda bir marta chaqiriladi. */
export async function loadTokens(): Promise<void> {
  if (Platform.OS === "web") {
    accessToken = webStore.get(ACCESS_KEY);
    refreshToken = webStore.get(REFRESH_KEY);
    return;
  }
  try {
    const [a, r] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    accessToken = a;
    refreshToken = r;
  } catch {
    accessToken = null;
    refreshToken = null;
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function setTokens(tokens: { access_token: string; refresh_token: string }) {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
  void persist(ACCESS_KEY, accessToken);
  void persist(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  void persist(ACCESS_KEY, null);
  void persist(REFRESH_KEY, null);
}
