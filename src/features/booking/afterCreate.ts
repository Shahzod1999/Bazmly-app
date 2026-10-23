import { router } from "expo-router";
import type { BookingOwnerDetail } from "../../api";
import { haptic } from "../../lib/haptics";

/**
 * Bron yaratilgach — natija ekrani. Onlayn to'lov yo'q (backend DECISIONS.md Part 10):
 * bron `pending` holatida yaratiladi va muassasa tasdiqlaydi; depozit bo'lsa joyida kelishiladi.
 */
export function goAfterBookingCreated(detail: BookingOwnerDetail) {
  haptic.success();
  router.replace({ pathname: "/booking-success/[bookingId]", params: { bookingId: String(detail.booking.id) } });
}
