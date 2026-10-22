/**
 * Mock rejim flaglari. Backend'da hali yo'q endpointlar (BACKEND_CONTRACT.md)
 * shu flaglar yoqilgan bo'lsa mock bilan ishlaydi. Qolgan hammasi — real backend.
 *
 * .env:
 *   EXPO_PUBLIC_MOCK_OTP=true
 *   EXPO_PUBLIC_MOCK_PAYMENTS=true
 */
const truthy = (v: string | undefined, fallback: boolean) =>
  v === undefined ? fallback : v === "true" || v === "1";

export const MOCK_OTP = truthy(process.env.EXPO_PUBLIC_MOCK_OTP, true);
export const MOCK_PAYMENTS = truthy(process.env.EXPO_PUBLIC_MOCK_PAYMENTS, true);

/** Mock OTP kodi — faqat mock rejimda ishlaydi. */
export const MOCK_OTP_CODE = "111111";
