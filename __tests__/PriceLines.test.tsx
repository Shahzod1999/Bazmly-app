jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));

import React from "react";
import { render, screen } from "@testing-library/react-native";
import i18n from "../src/i18n";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { PriceLines } from "../src/features/booking/PriceLines";
import type { BookingOwnerDetail } from "../src/api";

const detail = {
  booking: { total_amount: "27500000.00", deposit_amount: "2750000.00", currency: "UZS" },
  price_lines: [
    { id: 2, sort_order: 2, line_type: "service", label_snapshot: "Tayyor dasturxon", unit_price: "100000", quantity: 250, amount: "25000000.00" },
    { id: 1, sort_order: 1, line_type: "table_fee", label_snapshot: "Zal ijarasi", unit_price: "2500000", quantity: 1, amount: "2500000.00" },
    { id: 3, sort_order: 3, line_type: "deposit", label_snapshot: "Depozit", unit_price: "0", quantity: 1, amount: "2750000.00" },
  ],
} as unknown as BookingOwnerDetail;

describe("PriceLines", () => {
  beforeAll(() => i18n.changeLanguage("uz"));

  it("backend qatorlarini tartib bilan ko'rsatadi, depozitni alohida chiqaradi, o'zi hisoblamaydi", async () => {
    // RNTL v14: render asinxron (React 19)
    await render(
      <ThemeProvider>
        <PriceLines detail={detail} />
      </ThemeProvider>,
    );
    const hall = screen.getByText("Zal ijarasi");
    const service = screen.getByText("Tayyor dasturxon × 250");
    expect(hall).toBeTruthy();
    expect(service).toBeTruthy();
    expect(screen.getByText("25 000 000 so'm")).toBeTruthy();
    expect(screen.getByText("27 500 000 so'm")).toBeTruthy(); // jami — backend qiymati
    expect(screen.getByText("2 750 000 so'm")).toBeTruthy(); // depozit
    expect(screen.queryByText("Depozit")).toBeNull(); // deposit qatori ro'yxatda takrorlanmaydi
  });
});
