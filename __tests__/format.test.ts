/// <reference types="jest" />
/// <reference types="node" />
jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));

import i18n from "../src/i18n";
import {
  formatMoney,
  formatMoneyCompact,
  formatPhone,
  groupDigits,
  isValidUzPhone,
  maskLocalPhone,
  mondayBasedWeekday,
  parseDateOnly,
  toDateOnly,
  toE164,
} from "../src/lib/format";

describe("pul formati", () => {
  afterEach(async () => {
    await i18n.changeLanguage("uz");
  });

  it("raqamlarni bo'shliq bilan guruhlaydi", () => {
    expect(groupDigits(25000000)).toBe("25 000 000");
    expect(groupDigits("2500000.00")).toBe("2 500 000");
    expect(groupDigits(null)).toBe("—");
  });

  it("tilga qarab valyuta yorlig'i", async () => {
    await i18n.changeLanguage("uz");
    expect(formatMoney("25000000")).toBe("25 000 000 so'm");
    await i18n.changeLanguage("ru");
    expect(formatMoney(25000000)).toBe("25 000 000 сум");
    await i18n.changeLanguage("en");
    expect(formatMoney(25000000)).toBe("25 000 000 UZS");
  });

  it("katta summalarni qisqartiradi", async () => {
    await i18n.changeLanguage("uz");
    expect(formatMoneyCompact(184500000)).toBe("184,5 mln so'm");
    expect(formatMoneyCompact(5000000)).toBe("5 000 000 so'm");
  });
});

describe("telefon", () => {
  it("mahalliy maska, E.164 va ko'rinish", () => {
    expect(maskLocalPhone("901234567")).toBe("90 123 45 67");
    expect(toE164("90 123 45 67")).toBe("+998901234567");
    expect(formatPhone("+998901234567")).toBe("+998 90 123 45 67");
  });

  it("operator kodlarini tekshiradi", () => {
    expect(isValidUzPhone("901234567")).toBe(true);
    expect(isValidUzPhone("331234567")).toBe(true);
    expect(isValidUzPhone("121234567")).toBe(false);
    expect(isValidUzPhone("90123456")).toBe(false);
  });
});

describe("sana", () => {
  it("YYYY-MM-DD ni UTC siljishisiz o'qiydi va qaytaradi", () => {
    const d = parseDateOnly("2026-11-01");
    expect(d.getDate()).toBe(1);
    expect(toDateOnly(d)).toBe("2026-11-01");
  });

  it("hafta kuni: 0 = Dushanba (backend formati)", () => {
    expect(mondayBasedWeekday(new Date(2026, 9, 19))).toBe(0); // dushanba
    expect(mondayBasedWeekday(new Date(2026, 9, 25))).toBe(6); // yakshanba
  });
});
