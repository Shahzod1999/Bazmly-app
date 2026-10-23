#!/usr/bin/env node
/**
 * Bazmly backend smoke test.
 *
 * Ilova (web va native) ishlatadigan endpointlarni chaqiradi va javob shaklini
 * src/api/types.ts dagi tiplarga solishtiradi. Sxemalar har safar types.ts dan
 * avtomatik generatsiya qilinadi, ya'ni tiplar o'zgarsa test ham o'zi yangilanadi.
 *
 * Ishga tushirish:
 *   npm run smoke                     # faqat ochiq endpointlar
 *   npm run smoke -- --json report.json
 *
 * Sozlash (.env yoki muhit o'zgaruvchilari):
 *   SMOKE_API_BASE_URL     standart: EXPO_PUBLIC_API_BASE_URL yoki prod Railway
 *   SMOKE_PHONE            mijoz test akkaunti, masalan +998901234567
 *   SMOKE_PASSWORD         uning paroli (parolsiz akkaunt bo'lsa bo'sh qoldiring)
 *   SMOKE_STAFF_LOGIN      hamkor xodimi logini (hamkor paneli testlari uchun)
 *   SMOKE_STAFF_PASSWORD
 *   SMOKE_VENUE_ID         tekshiriladigan venue (bo'lmasa qidiruvdagi birinchisi)
 *   SMOKE_WRITE=1          yozuvchi testlar: sevimli qo'shish/olib tashlash, stol broni
 *                          yaratish va darhol bekor qilish. FAQAT test venue bilan
 *                          (SMOKE_VENUE_ID majburiy) — prod'da haqiqiy bron yaratadi!
 *
 * Natija: ✓ o'tdi · ✗ xato (status yoki majburiy maydon/tip mos emas) ·
 *         ⚠ ogohlantirish (types.ts da yo'q qo'shimcha maydon, sekin javob) ·
 *         – o'tkazib yuborildi
 * Xato bo'lsa chiqish kodi 1 (CI'da ishlatish mumkin).
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ---------- .env ----------
function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv(resolve(ROOT, ".env"));

const env = process.env;
const BASE = (env.SMOKE_API_BASE_URL || env.EXPO_PUBLIC_API_BASE_URL || "https://bazmly-backend-production.up.railway.app").replace(/\/$/, "");
const WRITE = env.SMOKE_WRITE === "1" || env.SMOKE_WRITE === "true";
const SLOW_MS = 2000;
const TIMEOUT_MS = 20000;
const jsonOut = (() => {
  const i = process.argv.indexOf("--json");
  return i > -1 ? process.argv[i + 1] || "smoke-report.json" : null;
})();

// ---------- sxemalar (types.ts → JSON Schema) ----------
process.stdout.write("Sxemalar types.ts dan generatsiya qilinmoqda... ");
const { createGenerator } = require("ts-json-schema-generator");
const genOpts = { tsconfig: resolve(ROOT, "tsconfig.json"), type: "*", skipTypeCheck: true, expose: "export", additionalProperties: false };
const definitions = createGenerator({ ...genOpts, path: resolve(ROOT, "src/api/types.ts") }).createSchema("*").definitions;
console.log(`${Object.keys(definitions).length} ta tip`);

const Ajv = require("ajv");
const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addSchema({ $id: "bazmly", definitions });

const ref = (name) => {
  if (!definitions[name]) throw new Error(`types.ts da "${name}" tipi yo'q`);
  return { $ref: `bazmly#/definitions/${name}` };
};
const arrayOf = (name) => ({ type: "array", items: ref(name) });
const pageOf = (name) => ({
  type: "object",
  required: ["items", "total", "limit", "offset"],
  properties: { items: arrayOf(name), total: { type: "number" }, limit: { type: "number" }, offset: { type: "number" } },
});
const validators = new Map();
function validate(schema, data) {
  const key = JSON.stringify(schema);
  if (!validators.has(key)) validators.set(key, ajv.compile(schema));
  const fn = validators.get(key);
  if (fn(data)) return { errors: [], extras: [] };
  const errors = [];
  const extras = [];
  for (const e of fn.errors) {
    const at = e.instancePath || "(ildiz)";
    if (e.keyword === "additionalProperties") extras.push(`${at}.${e.params.additionalProperty}`);
    else if (e.keyword === "required") errors.push(`${at}: "${e.params.missingProperty}" yo'q`);
    else if (e.keyword === "anyOf" || e.keyword === "oneOf") continue; // ichki xatolar alohida chiqadi
    else errors.push(`${at}: ${e.message}`);
  }
  return { errors: [...new Set(errors)], extras: [...new Set(extras)] };
}

// ---------- HTTP ----------
let customerToken = null;
let partnerToken = null;

async function call(method, path, { body, token, query } = {}) {
  let url = `${BASE}/api/v1${path}`;
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    if (qs) url += `?${qs}`;
  }
  const headers = { Accept: "application/json", "Accept-Language": "uz" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ctrl.signal });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { status: res.status, data, ms: Date.now() - started };
  } catch (e) {
    return { status: 0, data: null, ms: Date.now() - started, netError: e.name === "AbortError" ? "timeout" : e.message };
  } finally {
    clearTimeout(timer);
  }
}

// ---------- natijalar ----------
const results = [];
let currentGroup = "";
const ICON = { pass: "✓", fail: "✗", warn: "⚠", skip: "–" };

function record(r) {
  results.push({ group: currentGroup, ...r });
  const ms = r.ms !== undefined ? `${String(r.ms).padStart(5)}ms` : "       ";
  const status = r.status !== undefined ? String(r.status).padStart(3) : "   ";
  console.log(`  ${ICON[r.result]} ${status} ${ms}  ${r.name}${r.note ? `  — ${r.note}` : ""}`);
  for (const d of r.details ?? []) console.log(`        · ${d}`);
}

function group(title) {
  currentGroup = title;
  console.log(`\n${title}`);
}

/**
 * Bitta endpointni tekshiradi. `schema` — kutilgan javob sxemasi.
 * Muvaffaqiyatli bo'lsa javob ma'lumotini qaytaradi (keyingi qadamlar uchun).
 */
async function check(name, method, path, { schema, expect = [200], ...opts } = {}) {
  const r = await call(method, path, opts);
  const base = { name: `${method} ${path}${name ? `  (${name})` : ""}`, status: r.status, ms: r.ms };
  if (r.status === 0) {
    record({ ...base, result: "fail", note: `tarmoq xatosi: ${r.netError}` });
    return undefined;
  }
  if (!expect.includes(r.status)) {
    const msg = typeof r.data === "object" && r.data ? r.data.message || r.data.detail || r.data.code : String(r.data ?? "").slice(0, 120);
    record({ ...base, result: "fail", note: `kutilgan ${expect.join("/")}, keldi ${r.status}${msg ? `: ${typeof msg === "string" ? msg : JSON.stringify(msg).slice(0, 160)}` : ""}` });
    return undefined;
  }
  const details = [];
  let result = "pass";
  // Sxema faqat muvaffaqiyatli javobga qo'llanadi; kutilgan xato (403/404) tanasi xato konverti
  if (schema && r.status >= 200 && r.status < 300 && r.status !== 204) {
    const v = validate(schema, r.data);
    if (v.errors.length) {
      result = "fail";
      details.push(...v.errors.slice(0, 8).map((e) => `tip mos emas — ${e}`));
      if (v.errors.length > 8) details.push(`… yana ${v.errors.length - 8} ta`);
    }
    if (v.extras.length) {
      if (result === "pass") result = "warn";
      details.push(`types.ts da yo'q maydon(lar): ${v.extras.slice(0, 6).join(", ")}${v.extras.length > 6 ? " …" : ""}`);
    }
  }
  if (r.ms > SLOW_MS) {
    if (result === "pass") result = "warn";
    details.push(`sekin javob (${r.ms} ms > ${SLOW_MS} ms)`);
  }
  // Element soni faqat ro'yxat yoki Page<T> (items + total) uchun
  const count = Array.isArray(r.data) ? r.data.length : Array.isArray(r.data?.items) && typeof r.data?.total === "number" ? r.data.items.length : undefined;
  record({ ...base, result, details, note: count !== undefined ? `${count} ta element` : undefined });
  return r.data;
}


function skip(name, why) {
  record({ name, result: "skip", note: why });
}

const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoDate(d);
};

// ---------- testlar ----------
async function main() {
  console.log(`Backend: ${BASE}`);
  console.log(`Rejim: ${WRITE ? "O'QISH + YOZISH (SMOKE_WRITE=1)" : "faqat o'qish"}`);

  // Backend umuman ochilmasa — 60 ta bir xil xato o'rniga bitta aniq xabar
  const ping = await call("GET", "/regions");
  if (ping.status === 0) {
    console.error(`\n✗ Backend'ga ulanib bo'lmadi (${ping.netError}). URL va internetni tekshiring: ${BASE}`);
    process.exitCode = 2;
    return;
  }

  group("1. Ochiq endpointlar (token kerak emas)");
  const regions = await check("", "GET", "/regions", { schema: arrayOf("RegionRead") });
  if (regions?.[0]) await check("birinchi viloyat", "GET", `/regions/${regions[0].id}/districts`, { schema: arrayOf("DistrictRead") });
  await check("Toshkent markazi", "GET", "/districts/nearest", { query: { lat: 41.3111, lng: 69.2797 }, schema: ref("NearestDistrictRead") });
  await check("", "GET", "/amenities", { schema: arrayOf("AmenityRead") });
  await check("", "GET", "/service-catalog", { schema: arrayOf("ServiceCatalogRead") });
  const search = await check("", "GET", "/venues/search", { query: { limit: 5, offset: 0 }, schema: pageOf("VenueListItem") });
  await check("to'yxonalar", "GET", "/venues/search", { query: { venue_type: "toyxona", limit: 5 }, schema: pageOf("VenueListItem") });
  await check("restoranlar", "GET", "/venues/search", { query: { venue_type: "restoran", limit: 5 }, schema: pageOf("VenueListItem") });

  const venueId = env.SMOKE_VENUE_ID ? Number(env.SMOKE_VENUE_ID) : search?.items?.[0]?.id;
  let venueDetail;
  if (!venueId) {
    skip("Venue endpointlari", "qidiruvda venue yo'q va SMOKE_VENUE_ID berilmagan");
  } else {
    group(`2. Venue #${venueId}`);
    venueDetail = await check("", "GET", `/venues/${venueId}`, { schema: ref("VenueDetailRead") });
    await check("", "GET", `/venues/${venueId}/zones`, { schema: arrayOf("VenueZoneRead") });
    await check("", "GET", `/venues/${venueId}/menu`, { schema: arrayOf("MenuItemListItem") });
    await check("", "GET", `/venues/${venueId}/reviews`, { query: { limit: 5, offset: 0 }, schema: pageOf("ReviewListItem") });
    await check("", "GET", `/reviews/venue/${venueId}/aggregate`, { schema: ref("ReviewAggregateRead") });
    await check("30 kun", "GET", `/venues/${venueId}/availability`, { query: { date_from: daysFromNow(0), date_to: daysFromNow(30) }, schema: ref("BlockedDatesRead") });
    await check("ertaga 19:00–21:00", "GET", `/venues/${venueId}/tables`, {
      query: { booking_date: daysFromNow(1), start_time: "19:00", end_time: "21:00", min_seats: 2 },
      schema: arrayOf("AvailableTableRead"),
    });
    const groupId = venueDetail?.venue?.venue_group_id;
    if (groupId) await check("", "GET", `/venues/${venueId}/services`, { query: { group_id: groupId }, schema: arrayOf("VenueServiceRead") });
  }

  group("3. Avtorizatsiya");
  await check("ro'yxatdan o'tmagan raqam", "POST", "/auth/phone-check", { body: { phone: "+998900000001" }, schema: ref("PhoneCheckResult") });
  await check("noto'g'ri token", "GET", "/users/me", { token: "invalid.token.value", expect: [401, 403] });
  await check("noto'g'ri refresh token", "POST", "/auth/refresh", { body: { refresh_token: "invalid" }, expect: [400, 401, 403, 422] });

  if (env.SMOKE_PHONE) {
    await check("test raqam", "POST", "/auth/phone-check", { body: { phone: env.SMOKE_PHONE }, schema: ref("PhoneCheckResult") });
    const tokens = await check("mijoz", "POST", "/auth/login", {
      body: { phone: env.SMOKE_PHONE, password: env.SMOKE_PASSWORD || null },
      schema: ref("TokenPair"),
    });
    customerToken = tokens?.access_token ?? null;
    if (tokens?.refresh_token) {
      const refreshed = await check("haqiqiy refresh token", "POST", "/auth/refresh", { body: { refresh_token: tokens.refresh_token }, schema: ref("TokenPair") });
      if (refreshed?.access_token) customerToken = refreshed.access_token;
    }
  } else {
    skip("POST /auth/login", "SMOKE_PHONE berilmagan");
  }

  if (customerToken) {
    group("4. Mijoz (token bilan)");
    const t = { token: customerToken };
    const me = await check("", "GET", "/users/me", { ...t, schema: ref("UserRead") });
    await check("", "GET", "/users/me/devices", { ...t, schema: arrayOf("DeviceRead") });
    await check("", "GET", "/users/me/recent-locations", { ...t, schema: arrayOf("UserAddressRead") });
    await check("", "GET", "/users/me/friends", { ...t, schema: arrayOf("UserListItem") });
    await check("", "GET", "/users/me/friend-requests", { ...t, schema: arrayOf("FriendshipRead") });
    await check("", "GET", "/favorites", { ...t, schema: arrayOf("FavoriteRead") });
    await check("", "GET", "/notifications", { ...t, query: { limit: 10, offset: 0 }, schema: pageOf("NotificationRead") });
    await check("", "GET", "/notifications/unread-count", { ...t, schema: ref("UnreadCountRead") });
    const bookings = await check("", "GET", "/bookings", { ...t, schema: arrayOf("BookingListItem") });
    if (bookings?.[0]) await check("birinchi bron", "GET", `/bookings/${bookings[0].id}`, { ...t, schema: ref("BookingOwnerDetail") });
    else skip("GET /bookings/{id}", "foydalanuvchida bron yo'q");
    const convs = await check("", "GET", "/conversations", { ...t, schema: arrayOf("ConversationListItem") });
    if (convs?.[0]) await check("birinchi suhbat", "GET", `/conversations/${convs[0].id}/messages`, { ...t, schema: arrayOf("MessageRead") });

    if (WRITE) {
      group("5. Yozuvchi testlar (SMOKE_WRITE=1)");
      if (!env.SMOKE_VENUE_ID) {
        skip("Yozuvchi testlar", "SMOKE_VENUE_ID majburiy — tasodifiy prod venue'da bron yaratilmaydi");
      } else {
        const fav = await check("qo'shish", "POST", "/favorites", { ...t, body: { venue_id: venueId }, expect: [200, 201], schema: ref("FavoriteToggled") });
        if (fav) await check("olib tashlash", "DELETE", `/favorites/${venueId}`, { ...t, expect: [200, 204] });

        const date = daysFromNow(7);
        const free = await call("GET", `/venues/${venueId}/tables`, { query: { booking_date: date, start_time: "15:00", end_time: "16:00", min_seats: 1 } });
        const table = Array.isArray(free.data) ? free.data[0] : null;
        if (!table) {
          skip("POST /bookings/table", `${date} 15:00 da bo'sh stol yo'q (yoki venue to'yxona)`);
        } else {
          const created = await check(`stol #${table.id ?? table.table_id}, ${date} 15:00`, "POST", "/bookings/table", {
            ...t,
            expect: [200, 201],
            schema: ref("BookingOwnerDetail"),
            body: {
              venue_id: venueId,
              booking_date: date,
              start_time: "15:00:00",
              end_time: "16:00:00",
              guests_count: 1,
              contact_name: [me?.first_name, me?.last_name].filter(Boolean).join(" ") || "Smoke Test",
              contact_phone: me?.phone || env.SMOKE_PHONE,
              table_id: table.id ?? table.table_id,
              note: "SMOKE TEST — avtomatik bekor qilinadi",
            },
          });
          if (created?.booking?.id) {
            await check("darhol bekor qilish", "POST", `/bookings/${created.booking.id}/cancel`, { ...t, body: { reason: "smoke test" }, schema: ref("BookingRead") });
          }
        }
      }
    }
  }

  group("6. Hamkor paneli");
  if (env.SMOKE_STAFF_LOGIN && env.SMOKE_STAFF_PASSWORD) {
    const tokens = await check("xodim", "POST", "/auth/staff-login", { body: { login: env.SMOKE_STAFF_LOGIN, password: env.SMOKE_STAFF_PASSWORD }, schema: ref("TokenPair") });
    partnerToken = tokens?.access_token ?? null;
  } else if (customerToken) {
    partnerToken = customerToken; // mijoz akkaunti hamkor ham bo'lishi mumkin
    console.log("  (SMOKE_STAFF_LOGIN yo'q — mijoz tokeni bilan sinaladi; hamkor bo'lmasa 403 kutiladi)");
  }

  if (!partnerToken) {
    skip("Hamkor endpointlari", "SMOKE_STAFF_LOGIN/SMOKE_STAFF_PASSWORD yoki SMOKE_PHONE berilmagan");
  } else {
    const t = { token: partnerToken };
    // Mijoz tokeni bilan sinalayotgan bo'lsa, guruh yo'qligi (404) xato emas
    const usingCustomerToken = !(env.SMOKE_STAFF_LOGIN && env.SMOKE_STAFF_PASSWORD);
    await check("", "GET", "/venue/staff/me/workplaces", { ...t, schema: arrayOf("StaffWorkplaceRead") });
    const myGroupRes = await check("", "GET", "/venue/groups/me", {
      ...t,
      schema: ref("VenueGroupRead"),
      expect: usingCustomerToken ? [200, 404] : [200],
    });
    const myGroup = myGroupRes?.id ? myGroupRes : null;
    if (!myGroup && usingCustomerToken) {
      // Hamkor bo'lmagan akkaunt boshqa muassasaning ma'lumotini o'qiy olmasligi kerak
      await check("", "GET", "/venue/bookings", {
        ...t,
        query: { venue_id: env.SMOKE_VENUE_ID || 1, day: new Date().toISOString().slice(0, 10) },
        expect: [403],
      });
      await check("", "GET", "/venue/conversations", { ...t, query: { venue_id: env.SMOKE_VENUE_ID || 1 }, expect: [403] });
    }
    if (!myGroup) {
      skip("Qolgan hamkor endpointlari", "akkauntda hamkor guruhi yo'q");
    } else {
      const gid = myGroup.id;
      const branches = await check("", "GET", `/venue/groups/${gid}/branches`, { ...t, schema: ref("VenueGroupWithBranchesRead") });
      await check("", "GET", "/venue/venues", { ...t, query: { group_id: gid }, schema: arrayOf("VenueRead") });
      await check("", "GET", "/venue/venues/counts", { ...t, query: { group_id: gid }, schema: ref("VenueStatusCountsRead") });
      const vid = branches?.branches?.[0]?.id;
      if (!vid) {
        skip("Filial endpointlari", "guruhda filial yo'q");
      } else {
        await check("", "GET", `/venue/venues/${vid}`, { ...t, schema: ref("VenueRead") });
        await check("", "GET", `/venue/venues/${vid}/zones`, { ...t, schema: arrayOf("VenueZoneRead") });
        await check("", "GET", `/venue/venues/${vid}/tables`, { ...t, schema: arrayOf("VenueTableRead") });
        await check("bugun", "GET", "/venue/bookings", { ...t, query: { venue_id: vid, day: daysFromNow(0) }, schema: arrayOf("VenueBookingRead") });
        await check("", "GET", "/venue/analytics/dashboard", { ...t, query: { group_id: gid, venue_id: vid }, schema: ref("DashboardRead") });
        await check("7 kun", "GET", "/venue/analytics/daily", { ...t, query: { venue_id: vid, date_from: daysFromNow(-7), date_to: daysFromNow(0) }, schema: arrayOf("VenueDailyStatsRead") });
        await check("bu hafta / o'tgan hafta", "GET", "/venue/analytics/revenue", {
          ...t,
          query: {
            venue_id: vid,
            current_from: daysFromNow(-6),
            current_to: daysFromNow(0),
            previous_from: daysFromNow(-13),
            previous_to: daysFromNow(-7),
          },
          schema: ref("PeriodComparisonRead"),
        });
        await check("", "GET", "/venue/staff", { ...t, query: { group_id: gid, venue_id: vid }, schema: arrayOf("VenueStaffListItem") });
        await check("", "GET", "/venue/staff/counts", { ...t, query: { group_id: gid }, schema: ref("StaffCountsRead") });
        await check("", "GET", "/venue/conversations", { ...t, query: { venue_id: vid }, schema: arrayOf("ConversationListItem") });
        await check("", "GET", "/venue/staff/roles", { ...t, schema: arrayOf("StaffRoleRead") });
        await check("", "GET", "/venue/menu/categories", { ...t, query: { group_id: gid, venue_id: vid }, schema: arrayOf("MenuCategoryRead") });
        await check("", "GET", "/venue/menu/items", { ...t, query: { venue_id: vid }, schema: arrayOf("MenuItemListItem") });
        await check("", "GET", "/venue/orders/table-board", { ...t, query: { venue_id: vid }, schema: arrayOf("TableBoardRow") });
        await check("", "GET", "/venue/orders/kitchen-queue", { ...t, query: { venue_id: vid }, schema: arrayOf("KitchenQueueItem") });
        await check("", "GET", "/venue/orders", { ...t, query: { venue_id: vid }, schema: arrayOf("OrderListItem") });
        await check("noto'g'ri QR", "POST", "/venue/bookings/check-in", { ...t, body: { qr_token: "smoke-invalid-token", venue_id: vid }, expect: [400, 404, 409, 422] });
      }
    }
  }


  // ---------- xulosa ----------
  const count = (k) => results.filter((r) => r.result === k).length;
  console.log("\n────────────────────────────────────────");
  console.log(`✓ ${count("pass")}  ✗ ${count("fail")}  ⚠ ${count("warn")}  – ${count("skip")}`);
  const fails = results.filter((r) => r.result === "fail");
  if (fails.length) {
    console.log("\nXatolar:");
    for (const f of fails) console.log(`  ✗ [${f.group.split(".")[0]}] ${f.name}${f.note ? ` — ${f.note}` : ""}`);
  }
  if (jsonOut) {
    writeFileSync(jsonOut, JSON.stringify({ base: BASE, write: WRITE, at: new Date().toISOString(), results }, null, 2));
    console.log(`\nJSON hisobot: ${jsonOut}`);
  }
  process.exitCode = fails.length ? 1 : 0;
}

main().catch((e) => {
  console.error("\nSmoke test ishdan chiqdi:", e);
  process.exitCode = 2;
});
