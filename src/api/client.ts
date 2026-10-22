import type { ApiErrorResponse, TokenPair } from "./types";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./tokens";

export { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./tokens";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://bazmly-backend-production.up.railway.app";

const REQUEST_TIMEOUT_MS = 15_000;

export class BazmlyApiError extends Error {
  public code: string;
  public status: number;
  public details?: Record<string, any> | null;
  public requestId?: string;

  constructor(status: number, data: any) {
    let msg = data?.message;
    if (!msg && Array.isArray(data?.detail)) {
      msg = data.detail.map((d: any) => d.msg || `${d.loc?.join(".")}: ${d.msg}`).join(", ");
    } else if (!msg && typeof data?.detail === "string") {
      msg = data.detail;
    }
    super(msg || `So'rov bajarilmadi (${status})`);
    this.name = "BazmlyApiError";
    this.status = status;
    this.code = data?.code || "unknown_error";
    this.details = data?.details || (Array.isArray(data?.detail) ? { errors: data.detail } : null);
    this.requestId = data?.request_id;
  }
}

/** Tarmoq xatosi (internet yo'q, timeout) — status 0. */
export class NetworkError extends BazmlyApiError {
  constructor(code: "network_error" | "timeout") {
    super(0, {
      code,
      message:
        code === "timeout"
          ? "Server javob bermadi. Qayta urinib ko'ring."
          : "Internet aloqasi yo'q. Ulanishni tekshiring.",
    });
    this.name = "NetworkError";
  }
}

// ---------- Global hodisalar (logout, til) ----------

type Listener = () => void;
const logoutListeners = new Set<Listener>();

/** Sessiya tugaganda (refresh muvaffaqiyatsiz) chaqiriladi. */
export function onAuthLogout(cb: Listener): () => void {
  logoutListeners.add(cb);
  return () => logoutListeners.delete(cb);
}

function emitLogout() {
  logoutListeners.forEach((cb) => {
    try {
      cb();
    } catch {
      /* ignore */
    }
  });
}

let currentLanguage = "uz";
export function setApiLanguage(lang: string) {
  currentLanguage = lang;
}

// ---------- Token refresh (bitta umumiy promise) ----------
// Web versiyada refresh muvaffaqiyatsiz bo'lsa kutayotgan so'rovlar osilib qolar edi.
// Bu yerda hamma kutuvchilar bitta promise'ni kutadi: u null bilan tugasa — hammasi
// 401 xato bilan qaytadi va foydalanuvchi auth ekraniga yuboriladi.

let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return null;
    const data: TokenPair = await res.json();
    setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
    return data.access_token;
  } catch {
    return null;
  }
}

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ---------- fetch ----------

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e: any) {
    if (e?.name === "AbortError") throw new NetworkError("timeout");
    throw new NetworkError("network_error");
  } finally {
    clearTimeout(timer);
  }
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
}

export function buildUrl(endpoint: string, params?: Record<string, any>): string {
  let url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  if (params) {
    const parts: string[] = [];
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    });
    if (parts.length) url += (url.includes("?") ? "&" : "?") + parts.join("&");
  }
  return url;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, skipAuth, headers: customHeaders, ...rest } = options;
  const url = buildUrl(endpoint, params);

  const headers = new Headers(customHeaders || {});
  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;
  if (!headers.has("Content-Type") && !isFormData) headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  headers.set("Accept-Language", currentLanguage);

  const token = skipAuth ? null : getAccessToken();
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

  let response = await fetchWithTimeout(url, { ...rest, headers });

  if (response.status === 401 && !skipAuth) {
    const newToken = getRefreshToken() ? await refreshAccessToken() : null;
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetchWithTimeout(url, { ...rest, headers });
    } else {
      clearTokens();
      emitLogout();
    }
  }

  if (!response.ok) {
    let errorData: Partial<ApiErrorResponse> = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        code: "http_error",
        message: `HTTP xatosi: ${response.status}`,
      };
    }
    throw new BazmlyApiError(response.status, errorData);
  }

  if (response.status === 204) return {} as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}
