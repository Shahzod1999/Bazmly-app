/**
 * Backend'da HALI MAVJUD BO'LMAGAN endpointlar uchun tiplar.
 * To'liq spetsifikatsiya: BACKEND_CONTRACT.md
 * Backend tayyor bo'lgach, bu tiplar types.ts ga ko'chiriladi.
 */
import type { BookingOwnerDetail, TokenPair } from "./types";

// ---------- 6.1 SMS OTP ----------

export type OtpPurpose = "login";

export interface OtpSendRequest {
  phone: string; // +998XXXXXXXXX
  purpose: OtpPurpose;
}

export interface OtpSendResponse {
  request_id: string;
  expires_in_seconds: number;
  resend_after_seconds: number;
  code_length: number;
}

export interface OtpVerifyRequest {
  request_id: string;
  phone: string;
  code: string;
}

export type OtpVerifyResponse = TokenPair & {
  profile_completed: boolean;
  is_new_user: boolean;
};

export type OtpErrorCode = "otp_invalid" | "otp_expired" | "otp_attempts_exceeded" | "otp_rate_limited";

// ---------- 6.2 Karta va depozit ----------

export type CardBrand = "uzcard" | "humo";

export interface CardAddRequest {
  card_number: string; // faqat raqamlar, 16 ta
  expiry: string; // MM/YY
}

export interface CardAddResponse {
  card_request_id: string;
  phone_mask: string;
  resend_after_seconds: number;
}

export interface CardVerifyRequest {
  card_request_id: string;
  code: string;
}

export interface SavedCard {
  id: number;
  masked_pan: string; // "8600 **** **** 1234"
  brand: CardBrand;
  expiry: string; // MM/YY
  holder_name: string | null;
  is_default: boolean;
}

export type DepositStatus = "pending_otp" | "paid" | "failed";

export interface DepositRequest {
  card_id: number;
}

export interface DepositResponse {
  payment_id: string;
  status: DepositStatus;
  amount: string;
  currency: string;
  phone_mask?: string;
}

export interface PaymentConfirmRequest {
  code: string;
}

export interface PaymentConfirmResponse {
  status: "paid";
  booking: BookingOwnerDetail;
}

export type PaymentErrorCode =
  | "card_invalid"
  | "card_expired"
  | "card_not_supported"
  | "card_otp_invalid"
  | "card_otp_expired"
  | "insufficient_funds"
  | "payment_declined"
  | "booking_not_payable";
