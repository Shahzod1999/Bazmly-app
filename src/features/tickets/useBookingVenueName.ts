import type { BookingOwnerDetail } from "../../api";
import { useVenue } from "../../api/queries";

/**
 * Bron ma'lumotidagi muassasa nomi.
 * Backend `POST /bookings/*` va `GET /bookings/{id}` da `venue_name` ni bo'sh satr qaytaradi
 * (booking_service._detail_in_transaction venue_name=None). backend-patches dagi patch buni tuzatadi;
 * u qo'llanguncha nom venue'dan olinadi.
 */
export function useBookingVenueName(detail: BookingOwnerDetail | undefined): string {
  const needsFallback = !!detail && !detail.venue_name;
  const venue = useVenue(needsFallback ? detail!.booking.venue_id : 0);
  return detail?.venue_name || venue.data?.venue.name || "";
}
