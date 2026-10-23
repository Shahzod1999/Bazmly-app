/// <reference types="jest" />
/// <reference types="node" />
/**
 * Kirish oqimi (backend DECISIONS.md Part 9): SMS kod yo'q, telefon + ixtiyoriy parol.
 */
import { useAuth } from "../src/stores/auth";
import { getAccessToken, setTokens } from "../src/api/client";

type Call = { method: string; path: string; body: any; auth: string | null };

function backend(handler: (c: Call) => { status?: number; body?: unknown }) {
  const calls: Call[] = [];
  global.fetch = jest.fn(async (url: any, init: any = {}) => {
    const headers = new Headers(init.headers);
    const c: Call = {
      method: init.method ?? "GET",
      path: String(url).replace(/^.*\/api\/v1/, ""),
      body: init.body ? JSON.parse(init.body) : null,
      auth: headers.get("Authorization"),
    };
    calls.push(c);
    const r = handler(c);
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), { status: r.status ?? 200 });
  }) as any;
  return calls;
}

const tokens = (n: number) => ({ access_token: `acc${n}`, refresh_token: `ref${n}`, expires_in_seconds: 3600, user_id: 7, profile_completed: true });
const me = { id: 7, first_name: "Shahzod", last_name: "B", phone: "+998901234567", role: "customer", status: "active", theme: "system" };

describe("auth store — telefon bilan kirish", () => {
  beforeEach(() => useAuth.setState({ status: "guest", user: null }));

  it("parolsiz akkaunt: login faqat telefon bilan, password null yuboriladi", async () => {
    const calls = backend((c) => (c.path === "/auth/login" ? { body: tokens(1) } : c.path === "/users/me" ? { body: me } : { status: 404 }));
    const res = await useAuth.getState().loginPhone("+998901234567");
    expect(res).toBe("done");
    expect(calls[0]).toMatchObject({ method: "POST", path: "/auth/login", body: { phone: "+998901234567", password: null } });
    expect(useAuth.getState().status).toBe("authed");
    expect(getAccessToken()).toBe("acc1");
  });

  it("noto'g'ri parol: backend xabari foydalanuvchiga chiqadi, holat o'zgarmaydi", async () => {
    backend(() => ({ status: 403, body: { code: "permission_denied", message: "Telefon yoki parol noto'g'ri" } }));
    await expect(useAuth.getState().loginPhone("+998901234567", "xato")).rejects.toMatchObject({
      status: 403,
      message: "Telefon yoki parol noto'g'ri",
    });
    expect(useAuth.getState().status).toBe("guest");
  });

  it("ro'yxatdan o'tish: ism, familiya, ixtiyoriy parol va tuman yuboriladi", async () => {
    const calls = backend((c) => (c.path === "/auth/register" ? { status: 201, body: tokens(2) } : { body: me }));
    await useAuth.getState().register({ phone: "+998901234567", first_name: "Shahzod", last_name: "B", password: "", district_id: 3 });
    expect(calls[0].body).toEqual({ phone: "+998901234567", first_name: "Shahzod", last_name: "B", password: null, district_id: 3 });
    expect(useAuth.getState().status).toBe("authed");
  });

  it("ismi yo'q akkaunt (pending_profile) → ism ekrani", async () => {
    backend((c) =>
      c.path === "/auth/login" ? { body: { ...tokens(3), profile_completed: false } } : { body: { ...me, first_name: "", status: "pending_profile" } },
    );
    await expect(useAuth.getState().loginPhone("+998901234567")).resolves.toBe("needs_profile");
  });

  it("parol o'rnatilgach (backend barcha sessiyalarni bekor qiladi) yangi parol bilan qayta kiriladi", async () => {
    setTokens({ access_token: "old", refresh_token: "oldr" });
    useAuth.setState({ status: "authed", user: me as any });
    const calls = backend((c) =>
      c.path === "/auth/password" ? { status: 204 } : c.path === "/auth/login" ? { body: tokens(4) } : { body: me },
    );
    await useAuth.getState().setPassword("yangiParol1");
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual(["POST /auth/password", "POST /auth/login", "GET /users/me"]);
    expect(calls[0].body).toEqual({ new_password: "yangiParol1", current_password: null });
    expect(calls[1].body).toEqual({ phone: "+998901234567", password: "yangiParol1" });
    expect(getAccessToken()).toBe("acc4");
  });
});
