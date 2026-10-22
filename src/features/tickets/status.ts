import type { BookingStatus } from "../../api";
import type { BadgeTone } from "../../components/ui";

export function statusTone(s: BookingStatus): BadgeTone {
  switch (s) {
    case "confirmed":
      return "success";
    case "checked_in":
      return "info";
    case "pending":
      return "warning";
    case "completed":
      return "neutral";
    default:
      return "danger";
  }
}

export const ACTIVE_STATUSES: BookingStatus[] = ["pending", "confirmed", "checked_in"];
