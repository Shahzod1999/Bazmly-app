import type { CardBrand } from "../api/types.pending";

/** BIN bo'yicha karta turi: 8600 / 5614 → UzCard, 9860 → Humo */
export function detectCardBrand(digits: string): CardBrand | null {
  const d = digits.replace(/\D/g, "");
  if (d.startsWith("8600") || d.startsWith("5614")) return "uzcard";
  if (d.startsWith("9860")) return "humo";
  return null;
}

export function isLuhnValid(digits: string): boolean {
  const d = digits.replace(/\D/g, "");
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** "MM/YY" — joriy oydan oldin bo'lmasligi kerak */
export function isExpiryValid(expiry: string, now: Date = new Date()): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  return year > curY || (year === curY && month >= curM);
}

export function formatCardNumber(input: string): string {
  return input
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatExpiry(input: string): string {
  const d = input.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function maskPan(digits: string): string {
  const d = digits.replace(/\D/g, "");
  return `${d.slice(0, 4)} **** **** ${d.slice(-4)}`;
}
