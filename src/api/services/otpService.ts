import { apiFetch, BazmlyApiError, setTokens } from "../client";
import { MOCK_OTP, MOCK_OTP_CODE } from "../config.flags";
import type { OtpSendResponse, OtpVerifyResponse } from "../types.pending";
import { authService } from "./authService";

/**
 * SMS OTP orqali kirish (BACKEND_CONTRACT.md §1).
 *
 * Mock rejimda (EXPO_PUBLIC_MOCK_OTP=true):
 *  - kod har doim 111111
 *  - verify real backend'ning mavjud endpointlari orqali ishlaydi:
 *      ro'yxatdan o'tgan raqam  → POST /auth/login { phone }
 *      yangi raqam              → token qaytmaydi, is_new_user=true;
 *                                 ism kiritilgach POST /auth/register chaqiriladi
 */

let mockSeq = 0;
const mockRequests = new Map<string, { phone: string; expiresAt: number; attempts: number }>();

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type OtpVerifyResult =
  ({ kind: "tokens" } & OtpVerifyResponse) | { kind: "new_user_pending"; phone: string };

export const otpService = {
  async send(phone: string): Promise<OtpSendResponse> {
    if (MOCK_OTP) {
      await wait(600);
      const id = `mock-${Date.now()}-${++mockSeq}`;
      mockRequests.set(id, { phone, expiresAt: Date.now() + 120_000, attempts: 0 });
      return { request_id: id, expires_in_seconds: 120, resend_after_seconds: 60, code_length: 6 };
    }
    return apiFetch<OtpSendResponse>("/api/v1/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone, purpose: "login" }),
      skipAuth: true,
    });
  },

  async verify(requestId: string, phone: string, code: string): Promise<OtpVerifyResult> {
    if (MOCK_OTP) {
      await wait(500);
      const req = mockRequests.get(requestId);
      if (!req || req.phone !== phone) {
        throw new BazmlyApiError(400, {
          code: "otp_expired",
          message: "Kod muddati tugagan. Qayta yuboring.",
        });
      }
      if (Date.now() > req.expiresAt) {
        throw new BazmlyApiError(400, {
          code: "otp_expired",
          message: "Kod muddati tugagan. Qayta yuboring.",
        });
      }
      req.attempts += 1;
      if (req.attempts > 5) {
        throw new BazmlyApiError(400, {
          code: "otp_attempts_exceeded",
          message: "Urinishlar soni tugadi. Yangi kod so'rang.",
        });
      }
      if (code !== MOCK_OTP_CODE) {
        throw new BazmlyApiError(400, { code: "otp_invalid", message: "Kod noto'g'ri." });
      }
      mockRequests.delete(requestId);

      const check = await authService.checkPhone(phone);
      if (!check.registered) return { kind: "new_user_pending", phone };
      const tokens = await authService.login({ phone });
      return {
        kind: "tokens",
        ...tokens,
        profile_completed: tokens.profile_completed ?? true,
        is_new_user: false,
      };
    }

    const res = await apiFetch<OtpVerifyResponse>("/api/v1/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ request_id: requestId, phone, code }),
      skipAuth: true,
    });
    // Tokenlarni saqlash — authService bilan bir xil xulq
    setTokens({ access_token: res.access_token, refresh_token: res.refresh_token });
    return { kind: "tokens", ...res };
  },
};
