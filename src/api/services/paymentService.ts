import { apiFetch, BazmlyApiError } from "../client";
import { MOCK_PAYMENTS } from "../config.flags";
import type { CardAddResponse, DepositResponse, PaymentConfirmResponse, SavedCard } from "../types.pending";
import { kv } from "../../lib/storage";
import { detectCardBrand, isLuhnValid, isExpiryValid, maskPan } from "../../lib/card";
import { bookingService } from "./bookingService";

/**
 * Karta saqlash va depozit to'lovi (BACKEND_CONTRACT.md §2).
 *
 * MUHIM: karta raqami ilovada saqlanmaydi va loglanmaydi.
 * Mock rejimda ham faqat maskali ko'rinish (SavedCard) saqlanadi.
 */

const MOCK_CARDS_KEY = "mock_saved_cards";
const MOCK_OTP = "111111";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function loadMockCards(): SavedCard[] {
  try {
    return JSON.parse(kv.getString(MOCK_CARDS_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveMockCards(cards: SavedCard[]) {
  kv.set(MOCK_CARDS_KEY, JSON.stringify(cards));
}

const pendingMockCards = new Map<string, Omit<SavedCard, "id" | "is_default">>();
const pendingMockPayments = new Map<string, { bookingId: number }>();

export const paymentService = {
  async listCards(): Promise<SavedCard[]> {
    if (MOCK_PAYMENTS) {
      await wait(250);
      return loadMockCards();
    }
    return apiFetch<SavedCard[]>("/api/v1/payments/cards");
  },

  async addCard(cardNumber: string, expiry: string): Promise<CardAddResponse> {
    const digits = cardNumber.replace(/\D/g, "");
    if (MOCK_PAYMENTS) {
      await wait(700);
      const brand = detectCardBrand(digits);
      if (!brand)
        throw new BazmlyApiError(400, {
          code: "card_not_supported",
          message: "Faqat UzCard va Humo kartalari qabul qilinadi.",
        });
      if (!isLuhnValid(digits))
        throw new BazmlyApiError(400, { code: "card_invalid", message: "Karta raqami noto'g'ri." });
      if (!isExpiryValid(expiry))
        throw new BazmlyApiError(400, { code: "card_expired", message: "Karta muddati o'tgan." });
      const id = `mockcard-${Date.now()}`;
      pendingMockCards.set(id, { masked_pan: maskPan(digits), brand, expiry, holder_name: null });
      return { card_request_id: id, phone_mask: "+998 ** *** ** 67", resend_after_seconds: 60 };
    }
    return apiFetch<CardAddResponse>("/api/v1/payments/cards", {
      method: "POST",
      body: JSON.stringify({ card_number: digits, expiry }),
    });
  },

  async verifyCard(cardRequestId: string, code: string): Promise<SavedCard> {
    if (MOCK_PAYMENTS) {
      await wait(600);
      const pending = pendingMockCards.get(cardRequestId);
      if (!pending)
        throw new BazmlyApiError(400, { code: "card_otp_expired", message: "Kod muddati tugagan." });
      if (code !== MOCK_OTP)
        throw new BazmlyApiError(400, { code: "card_otp_invalid", message: "Kod noto'g'ri." });
      pendingMockCards.delete(cardRequestId);
      const cards = loadMockCards();
      const card: SavedCard = { ...pending, id: Date.now(), is_default: cards.length === 0 };
      saveMockCards([...cards, card]);
      return card;
    }
    return apiFetch<SavedCard>("/api/v1/payments/cards/verify", {
      method: "POST",
      body: JSON.stringify({ card_request_id: cardRequestId, code }),
    });
  },

  async deleteCard(cardId: number): Promise<void> {
    if (MOCK_PAYMENTS) {
      await wait(300);
      saveMockCards(loadMockCards().filter((c) => c.id !== cardId));
      return;
    }
    return apiFetch<void>(`/api/v1/payments/cards/${cardId}`, { method: "DELETE" });
  },

  async payDeposit(bookingId: number, cardId: number): Promise<DepositResponse> {
    if (MOCK_PAYMENTS) {
      await wait(800);
      const detail = await bookingService.getBookingDetail(bookingId);
      const paymentId = `mockpay-${Date.now()}`;
      pendingMockPayments.set(paymentId, { bookingId });
      return {
        payment_id: paymentId,
        status: "pending_otp",
        amount: detail.booking.deposit_amount,
        currency: detail.booking.currency,
        phone_mask: "+998 ** *** ** 67",
      };
    }
    return apiFetch<DepositResponse>(`/api/v1/bookings/${bookingId}/deposit`, {
      method: "POST",
      body: JSON.stringify({ card_id: cardId }),
    });
  },

  async confirmPayment(paymentId: string, code: string): Promise<PaymentConfirmResponse> {
    if (MOCK_PAYMENTS) {
      await wait(900);
      const p = pendingMockPayments.get(paymentId);
      if (!p) throw new BazmlyApiError(400, { code: "card_otp_expired", message: "Kod muddati tugagan." });
      if (code !== MOCK_OTP)
        throw new BazmlyApiError(400, { code: "card_otp_invalid", message: "Kod noto'g'ri." });
      pendingMockPayments.delete(paymentId);
      const booking = await bookingService.getBookingDetail(p.bookingId);
      return { status: "paid", booking };
    }
    return apiFetch<PaymentConfirmResponse>(`/api/v1/payments/${paymentId}/confirm`, {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },
};
