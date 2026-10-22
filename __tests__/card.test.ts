import { detectCardBrand, formatCardNumber, formatExpiry, isExpiryValid, isLuhnValid, maskPan } from "../src/lib/card";

/** Luhn bo'yicha to'g'ri nazorat raqamini qo'shadi */
function withLuhn(prefix15: string): string {
  for (let d = 0; d <= 9; d++) if (isLuhnValid(prefix15 + d)) return prefix15 + d;
  throw new Error("unreachable");
}

describe("karta validatsiyasi", () => {
  it("BIN bo'yicha UzCard / Humo ni aniqlaydi, boshqalarni rad etadi", () => {
    expect(detectCardBrand("8600 1234 5678 9012")).toBe("uzcard");
    expect(detectCardBrand("5614123456789012")).toBe("uzcard");
    expect(detectCardBrand("9860123456789012")).toBe("humo");
    expect(detectCardBrand("4111111111111111")).toBeNull();
  });

  it("Luhn tekshiruvi", () => {
    const valid = withLuhn("860012341234123");
    expect(isLuhnValid(valid)).toBe(true);
    const broken = valid.slice(0, -1) + ((Number(valid.slice(-1)) + 1) % 10);
    expect(isLuhnValid(broken)).toBe(false);
    expect(isLuhnValid("1234")).toBe(false);
  });

  it("muddat: joriy oy amal qiladi, o'tgan oy — yo'q, noto'g'ri format — yo'q", () => {
    const now = new Date(2026, 9, 23); // 2026-yil oktabr
    expect(isExpiryValid("10/26", now)).toBe(true);
    expect(isExpiryValid("09/26", now)).toBe(false);
    expect(isExpiryValid("01/30", now)).toBe(true);
    expect(isExpiryValid("13/27", now)).toBe(false);
    expect(isExpiryValid("1227", now)).toBe(false);
  });

  it("formatlash va maskalash", () => {
    expect(formatCardNumber("8600123412341234999")).toBe("8600 1234 1234 1234");
    expect(formatExpiry("1228")).toBe("12/28");
    expect(formatExpiry("1")).toBe("1");
    expect(maskPan("8600123412341234")).toBe("8600 **** **** 1234");
  });
});
