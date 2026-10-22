import i18n from "../i18n";

/** "25000000" → "25 000 000" */
export function groupDigits(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const CURRENCY_LABEL: Record<string, string> = { uz: "so'm", ru: "сум", en: "UZS" };

/** "25000000" → "25 000 000 so'm" (tilga qarab) */
export function formatMoney(value: number | string | null | undefined, currency = "UZS"): string {
  if (value === null || value === undefined || value === "") return "—";
  const lang = i18n.language || "uz";
  const label = currency === "UZS" ? (CURRENCY_LABEL[lang] ?? "so'm") : currency;
  return `${groupDigits(value)} ${label}`;
}

const COMPACT: Record<string, [string, string]> = {
  uz: ["mln", "mlrd"],
  ru: ["млн", "млрд"],
  en: ["M", "B"],
};

/** Katta summalar uchun: 184500000 → "184,5 mln so'm" */
export function formatMoneyCompact(value: number | string | null | undefined, currency = "UZS"): string {
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) < 10_000_000) return formatMoney(value, currency);
  const lang = i18n.language || "uz";
  const [mln, mlrd] = COMPACT[lang] ?? COMPACT.uz;
  const label = currency === "UZS" ? (CURRENCY_LABEL[lang] ?? "so'm") : currency;
  const big = Math.abs(n) >= 1_000_000_000;
  const v = n / (big ? 1_000_000_000 : 1_000_000);
  const text = (Math.round(v * 10) / 10).toString().replace(".", lang === "en" ? "." : ",");
  return `${text} ${big ? mlrd : mln} ${label}`;
}

/** +998901234567 → +998 90 123 45 67 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("998")) {
    return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
  }
  return phone;
}

/** Foydalanuvchi kiritgan 9 xonani "90 123 45 67" ko'rinishiga keltiradi */
export function maskLocalPhone(input: string): string {
  const d = input.replace(/\D/g, "").slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.join(" ");
}

/** 9 ta mahalliy raqam → +998XXXXXXXXX */
export function toE164(local: string): string {
  return `+998${local.replace(/\D/g, "").slice(-9)}`;
}

export function isValidUzPhone(local: string): boolean {
  const d = local.replace(/\D/g, "");
  return (
    d.length === 9 &&
    /^(33|50|55|61|62|65|66|67|69|70|71|72|73|74|75|76|77|78|79|88|90|91|93|94|95|97|98|99|20)/.test(d)
  );
}

export function formatDistance(meters: number | null | undefined): string | null {
  if (meters === null || meters === undefined) return null;
  if (meters < 1000) return i18n.t("common.m", { value: Math.round(meters) });
  return i18n.t("common.km", { value: (meters / 1000).toFixed(meters < 10000 ? 1 : 0) });
}

/** "2026-11-12" → Date (mahalliy vaqt, UTC siljishisiz) */
export function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toDateOnly(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "2026-11-12" → "12 Noyabr 2026" */
export function formatDate(s: string | null | undefined, withYear = true): string {
  if (!s) return "—";
  const d = parseDateOnly(s.slice(0, 10));
  const months = i18n.t("months", { returnObjects: true }) as unknown as string[];
  const base = `${d.getDate()} ${months[d.getMonth()] ?? ""}`;
  return withYear ? `${base} ${d.getFullYear()}` : base;
}

/** Hafta kuni qisqa nomi; JS getDay() (0=Yakshanba) emas, backend formati 0=Dushanba */
export function weekdayShort(mondayBased: number): string {
  const arr = i18n.t("weekdays.short", { returnObjects: true }) as unknown as string[];
  return arr[mondayBased] ?? "";
}

export function weekdayLong(mondayBased: number): string {
  const arr = i18n.t("weekdays.long", { returnObjects: true }) as unknown as string[];
  return arr[mondayBased] ?? "";
}

export function mondayBasedWeekday(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** "18:00:00" → "18:00" */
export function formatTime(t: string | null | undefined): string {
  if (!t) return "—";
  return t.slice(0, 5);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${formatDate(toDateOnly(d), false)}, ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function initials(first?: string | null, last?: string | null): string {
  return `${(first || "").trim().charAt(0)}${(last || "").trim().charAt(0)}`.toUpperCase() || "B";
}
