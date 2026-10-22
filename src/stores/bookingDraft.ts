import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { zustandStorage } from "../lib/storage";

export type HallServiceMode = "ready" | "own";

export interface BookingDraft {
  venueId: number;
  kind: "hall" | "table";
  step: number;
  date: string | null; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  guests: number;
  tableId: number | null;
  zoneId: number | null;
  serviceMode: HallServiceMode | null;
  serviceIds: number[];
  contactName: string;
  contactPhone: string; // 9 ta mahalliy raqam
  note: string;
  updatedAt: number;
}

interface DraftState {
  drafts: Record<string, BookingDraft>;
  get: (venueId: number, kind: "hall" | "table") => BookingDraft | undefined;
  save: (d: BookingDraft) => void;
  clear: (venueId: number, kind: "hall" | "table") => void;
}

const key = (venueId: number, kind: string) => `${kind}:${venueId}`;
const TTL = 7 * 24 * 3600 * 1000;

/**
 * Bron oqimi qoralamasi — ilova yopilsa ham tanlovlar yo'qolmaydi (7 kun saqlanadi).
 */
export const useBookingDrafts = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: {},
      get: (venueId, kind) => {
        const d = get().drafts[key(venueId, kind)];
        if (!d) return undefined;
        if (Date.now() - d.updatedAt > TTL) return undefined;
        return d;
      },
      save: (d) =>
        set((s) => ({ drafts: { ...s.drafts, [key(d.venueId, d.kind)]: { ...d, updatedAt: Date.now() } } })),
      clear: (venueId, kind) =>
        set((s) => {
          const next = { ...s.drafts };
          delete next[key(venueId, kind)];
          return { drafts: next };
        }),
    }),
    { name: "bazmly-booking-drafts", storage: createJSONStorage(() => zustandStorage) },
  ),
);
