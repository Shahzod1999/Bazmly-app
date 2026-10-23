/** Notification payload'idan ilova ichidagi yo'lni aniqlaydi */
export function routeFromNotificationData(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null;
  const bookingId = data.booking_id ?? data.bookingId;
  const type = String(data.type ?? "");
  if (typeof data.url === "string" && data.url.startsWith("/")) return data.url;
  // Mijozdan muassasaga kelgan xabar (xodimga) va muassasa javobi (mijozga)
  if (data.conversation_id && type === "guest_message") return `/partner/messages/${data.conversation_id}`;
  if (data.conversation_id) return `/messages/${data.conversation_id}`;
  if (bookingId && (type.startsWith("partner_") || type === "new_booking")) return "/partner/bookings";
  if (bookingId) return `/ticket/${bookingId}`;
  if (data.venue_id) return `/venue/${data.venue_id}`;
  return "/notifications";
}
