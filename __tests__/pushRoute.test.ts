/// <reference types="jest" />
import { routeFromNotificationData } from "../src/lib/pushRoute";

describe("push → ekran", () => {
  it("bron qarorlari mijozni chiptaga olib boradi", () => {
    for (const type of ["booking_requested", "booking_confirmed", "booking_rejected"]) {
      expect(routeFromNotificationData({ type, booking_id: 7, venue_id: 2 })).toBe("/ticket/7");
    }
  });
  it("yangi bron xodimni bronlar ro'yxatiga olib boradi", () => {
    expect(routeFromNotificationData({ type: "new_booking", booking_id: 7, venue_id: 2 })).toBe(
      "/partner/bookings",
    );
  });
  it("xabar venue_id bo'lsa ham chatni ochadi", () => {
    expect(routeFromNotificationData({ type: "message", conversation_id: 3, venue_id: 2 })).toBe(
      "/messages/3",
    );
    expect(routeFromNotificationData({ type: "guest_message", conversation_id: 3, venue_id: 2 })).toBe(
      "/partner/messages/3",
    );
  });
});
