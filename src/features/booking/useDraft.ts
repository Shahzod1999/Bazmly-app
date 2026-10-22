import { useEffect, useState } from "react";
import { useAuth } from "../../stores/auth";
import { useBookingDrafts, type BookingDraft } from "../../stores/bookingDraft";
import { toast } from "../../components/ui";
import i18n from "../../i18n";

function localPhone(phone: string | null | undefined): string {
  const d = (phone ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : "";
}

/** Bron qoralamasini yuklaydi (bo'lsa) va har o'zgarishda saqlaydi */
export function useDraft(venueId: number, kind: "hall" | "table") {
  const user = useAuth((s) => s.user);
  const store = useBookingDrafts();
  // Qoralama tiklanganmi — faqat birinchi render'da aniqlanadi
  const [restored] = useState(() => !!useBookingDrafts.getState().get(venueId, kind));
  const [draft, setDraft] = useState<BookingDraft>(() => {
    const existing = useBookingDrafts.getState().get(venueId, kind);
    if (existing) return existing;
    return {
      venueId,
      kind,
      step: 0,
      date: null,
      startTime: kind === "hall" ? "18:00" : "19:00",
      endTime: kind === "hall" ? "23:00" : "21:00",
      guests: kind === "hall" ? 200 : 2,
      tableId: null,
      zoneId: null,
      serviceMode: null,
      serviceIds: [],
      contactName: [user?.first_name, user?.last_name].filter(Boolean).join(" "),
      contactPhone: localPhone(user?.phone),
      note: "",
      updatedAt: Date.now(),
    };
  });

  useEffect(() => {
    if (restored && draft.step > 0) toast.info(i18n.t("booking.draftRestored"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    store.save(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const update = (patch: Partial<BookingDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const clear = () => store.clear(venueId, kind);
  return { draft, update, clear };
}

/** "18:00" + n daqiqa → "20:00" (sutka chegarasida 23:59 da to'xtaydi) */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function toApiTime(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
}

/** 30 daqiqalik vaqt slotlari */
export function timeSlots(from = "10:00", to = "22:00", stepMin = 30): string[] {
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const out: string[] = [];
  for (let x = fh * 60 + fm; x <= th * 60 + tm; x += stepMin) {
    out.push(`${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`);
  }
  return out;
}
