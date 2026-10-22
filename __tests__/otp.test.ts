/// <reference types="jest" />
/// <reference types="node" />
/** Mock OTP oqimi (EXPO_PUBLIC_MOCK_OTP default true) */
jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(async () => {}), deleteItemAsync: jest.fn(async () => {}) }));

import { otpService } from "../src/api/services/otpService";
import { getAccessToken } from "../src/api/client";

function backend(registered: boolean) {
  global.fetch = jest.fn(async (url: any) => {
    const u = String(url);
    if (u.endsWith("/auth/phone-check")) return new Response(JSON.stringify({ phone: "+998901234567", registered, password_required: false }));
    if (u.endsWith("/auth/login"))
      return new Response(JSON.stringify({ access_token: "acc", refresh_token: "ref", expires_in_seconds: 3600, user_id: 9, profile_completed: true }));
    return new Response("{}", { status: 404 });
  }) as any;
}

describe("otpService (mock)", () => {
  it("noto'g'ri kod → otp_invalid", async () => {
    backend(true);
    const { request_id } = await otpService.send("+998901234567");
    await expect(otpService.verify(request_id, "+998901234567", "000000")).rejects.toMatchObject({ code: "otp_invalid" });
  });

  it("boshqa raqam bilan request_id → otp_expired", async () => {
    backend(true);
    const { request_id } = await otpService.send("+998901234567");
    await expect(otpService.verify(request_id, "+998911111111", "111111")).rejects.toMatchObject({ code: "otp_expired" });
  });

  it("ro'yxatdan o'tgan raqam → tokenlar saqlanadi", async () => {
    backend(true);
    const { request_id, code_length } = await otpService.send("+998901234567");
    expect(code_length).toBe(6);
    const r = await otpService.verify(request_id, "+998901234567", "111111");
    expect(r.kind).toBe("tokens");
    expect(getAccessToken()).toBe("acc");
  });

  it("yangi raqam → ism so'rash bosqichi", async () => {
    backend(false);
    const { request_id } = await otpService.send("+998901234567");
    const r = await otpService.verify(request_id, "+998901234567", "111111");
    expect(r).toEqual({ kind: "new_user_pending", phone: "+998901234567" });
  });

  it("5 tadan ortiq urinish → otp_attempts_exceeded", async () => {
    backend(true);
    const { request_id } = await otpService.send("+998901234567");
    for (let i = 0; i < 5; i++) await expect(otpService.verify(request_id, "+998901234567", "000000")).rejects.toBeTruthy();
    await expect(otpService.verify(request_id, "+998901234567", "111111")).rejects.toMatchObject({ code: "otp_attempts_exceeded" });
  });
});
