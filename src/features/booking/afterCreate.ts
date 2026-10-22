import { router } from "expo-router";
import type { BookingOwnerDetail } from "../../api";
import { haptic } from "../../lib/haptics";

/** Bron yaratilgach: depozit kerak bo'lsa — to'lovga, aks holda — muvaffaqiyat ekraniga */
export function goAfterBookingCreated(detail: BookingOwnerDetail) {
  haptic.success();
  const id = String(detail.booking.id);
  if (Number(detail.booking.deposit_amount) > 0) {
    router.replace({ pathname: "/payment/[bookingId]", params: { bookingId: id } });
  } else {
    router.replace({ pathname: "/payment-success/[bookingId]", params: { bookingId: id, noDeposit: "1" } });
  }
}
