/// <reference types="jest" />
/// <reference types="node" />
/**
 * API client: token refresh mutex va 401 oqimi.
 * Web versiyadagi xato: refresh muvaffaqiyatsiz bo'lsa navbatdagi so'rovlar osilib qolardi.
 */
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

import { apiFetch, BazmlyApiError, buildUrl, onAuthLogout, setTokens, getAccessToken } from "../src/api/client";

type Handler = (url: string, init: RequestInit) => { status: number; body?: unknown };

function mockFetch(handler: Handler) {
  const calls: { url: string; auth: string | null }[] = [];
  global.fetch = jest.fn(async (url: any, init: any = {}) => {
    const headers = new Headers(init.headers);
    calls.push({ url: String(url), auth: headers.get("Authorization") });
    const r = handler(String(url), init);
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), { status: r.status });
  }) as any;
  return calls;
}

const tick = () => new Promise((r) => setTimeout(r, 5));

describe("apiFetch — token refresh", () => {
  beforeEach(() => setTokens({ access_token: "old", refresh_token: "rt" }));

  it("bir vaqtdagi 401 lar uchun refresh FAQAT BIR MARTA chaqiriladi va hammasi yangi token bilan qayta yuboriladi", async () => {
    let refreshCount = 0;
    const calls = mockFetch((url, init) => {
      if (url.endsWith("/auth/refresh")) {
        refreshCount++;
        return { status: 200, body: { access_token: "new", refresh_token: "rt2", expires_in_seconds: 3600, user_id: 1 } };
      }
      const auth = new Headers(init.headers).get("Authorization");
      return auth === "Bearer new" ? { status: 200, body: { ok: true, url } } : { status: 401, body: { code: "unauthorized" } };
    });

    const results = await Promise.all([apiFetch<any>("/api/v1/a"), apiFetch<any>("/api/v1/b"), apiFetch<any>("/api/v1/c")]);

    expect(refreshCount).toBe(1);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(getAccessToken()).toBe("new");
    expect(calls.filter((c) => c.auth === "Bearer new")).toHaveLength(3);
  });

  it("refresh muvaffaqiyatsiz bo'lsa barcha so'rovlar 401 bilan REJECT bo'ladi (osilib qolmaydi) va logout chiqariladi", async () => {
    mockFetch((url) => (url.endsWith("/auth/refresh") ? { status: 401, body: {} } : { status: 401, body: { code: "unauthorized", message: "Sessiya tugadi" } }));
    const onLogout = jest.fn();
    const off = onAuthLogout(onLogout);

    const settled = await Promise.race([
      Promise.allSettled([apiFetch("/api/v1/a"), apiFetch("/api/v1/b")]),
      new Promise((_, rej) => setTimeout(() => rej(new Error("osilib qoldi")), 2000)),
    ]);
    off();

    const s = settled as PromiseSettledResult<unknown>[];
    expect(s.every((x) => x.status === "rejected")).toBe(true);
    s.forEach((x) => {
      const err = (x as PromiseRejectedResult).reason;
      expect(err).toBeInstanceOf(BazmlyApiError);
      expect(err.status).toBe(401);
    });
    expect(onLogout).toHaveBeenCalled();
    expect(getAccessToken()).toBeNull();
  });

  it("skipAuth so'rovlarida 401 refresh'ni ishga tushirmaydi", async () => {
    let refreshCount = 0;
    mockFetch((url) => {
      if (url.endsWith("/auth/refresh")) refreshCount++;
      return { status: 401, body: { code: "otp_invalid", message: "Kod noto'g'ri." } };
    });
    await expect(apiFetch("/api/v1/auth/otp/verify", { method: "POST", skipAuth: true })).rejects.toMatchObject({
      status: 401,
      code: "otp_invalid",
      message: "Kod noto'g'ri.",
    });
    await tick();
    expect(refreshCount).toBe(0);
  });
});

describe("apiFetch — boshqa xulq", () => {
  it("Accept-Language va Bearer sarlavhalarini yuboradi, 204 ni bo'sh obyekt sifatida qaytaradi", async () => {
    setTokens({ access_token: "tok", refresh_token: "rt" });
    let seen: Headers | null = null;
    global.fetch = jest.fn(async (_u: any, init: any) => {
      seen = new Headers(init.headers);
      return new Response(null, { status: 204 });
    }) as any;
    await expect(apiFetch("/api/v1/x", { method: "DELETE" })).resolves.toEqual({});
    expect(seen!.get("Authorization")).toBe("Bearer tok");
    expect(seen!.get("Accept-Language")).toBeTruthy();
  });

  it("FastAPI validatsiya xatosidan (detail[]) tushunarli xabar yasaydi", () => {
    const e = new BazmlyApiError(422, { detail: [{ loc: ["body", "phone"], msg: "field required" }] });
    expect(e.message).toBe("field required");
    expect(e.details).toEqual({ errors: [{ loc: ["body", "phone"], msg: "field required" }] });
  });

  it("tarmoq xatosini NetworkError (status 0) ga aylantiradi", async () => {
    global.fetch = jest.fn(async () => {
      throw new TypeError("Network request failed");
    }) as any;
    await expect(apiFetch("/api/v1/x", { skipAuth: true })).rejects.toMatchObject({ status: 0, code: "network_error" });
  });

  it("buildUrl ro'yxatni FastAPI kutganidek takrorlanuvchi parametr qiladi", () => {
    expect(buildUrl("/api/v1/venue/bookings", { venue_id: 1, statuses: ["pending", "confirmed"], x: [] })).toMatch(
      /\?venue_id=1&statuses=pending&statuses=confirmed$/,
    );
  });

  it("buildUrl bo'sh/undefined parametrlarni tashlab yuboradi va kodlaydi", () => {
    const url = buildUrl("/api/v1/venues/search", { query: "Oltin saroy", district_id: 5, sort: "", min_rating: undefined, x: null });
    expect(url).toMatch(/\/api\/v1\/venues\/search\?query=Oltin%20saroy&district_id=5$/);
  });
});
