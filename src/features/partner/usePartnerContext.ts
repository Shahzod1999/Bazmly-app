import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { zustandStorage } from "../../lib/storage";
import { useMyVenues, useMyWorkplaces } from "../../api/queries";
import type { StaffRoleRead } from "../../api";

interface BranchState {
  venueId: number | null;
  setVenueId: (id: number | null) => void;
}

/** Tanlangan filial (hamkorning bir nechta filiali bo'lishi mumkin) */
export const useBranchStore = create<BranchState>()(
  persist((set) => ({ venueId: null, setVenueId: (venueId) => set({ venueId }) }), {
    name: "bazmly-partner-branch",
    storage: createJSONStorage(() => zustandStorage),
  }),
);

/** Backend'dagi huquq nomlari (staff_role_permissions) */
export type Permission =
  | "branch.manage"
  | "branch.create"
  | "staff.manage"
  | "menu.edit"
  | "menu.publish"
  | "orders.open"
  | "orders.add_items"
  | "orders.close"
  | "orders.discount"
  | "bookings.confirm"
  | "bookings.cancel"
  | "reports.view"
  | "settings.edit";

export interface PartnerBranch {
  id: number;
  name: string;
}

/**
 * Hamkor paneli qaysi filial uchun ochilgani va unda nima qilish mumkinligi.
 *
 * Manba — `GET /venue/staff/me/workplaces`:
 * - ega yoki admin (tarmoq darajasidagi rol, `venue_id = null`) tarmoqning barcha filiallarini ko'radi;
 * - menejer, ofitsiant va boshqalar faqat o'zi ishlaydigan filiallarni ko'radi.
 * Panel bo'limlari va tugmalar `can(...)` ga qarab ko'rsatiladi. Backend baribir har bir amalni tekshiradi.
 */
export function usePartnerContext() {
  const wp = useMyWorkplaces();
  const rows = wp.data ?? [];
  const groupRow = rows.find((r) => r.venue_id == null);
  const groupVenues = useMyVenues(groupRow?.venue_group_id);
  const selectedId = useBranchStore((s) => s.venueId);
  const setVenueId = useBranchStore((s) => s.setVenueId);

  const venues: PartnerBranch[] = groupRow
    ? (groupVenues.data ?? []).map((v) => ({ id: v.id, name: v.name }))
    : rows
        .filter((r) => r.venue_id != null)
        .map((r) => ({ id: r.venue_id!, name: r.venue_name ?? "" }));
  const venue = venues.find((v) => v.id === selectedId) ?? venues[0] ?? null;

  const here = rows.filter((r) => r.venue_id == null || r.venue_id === venue?.id);
  const permissions = new Set(here.flatMap((r) => r.permissions));
  const role: StaffRoleRead | null = (groupRow ?? here[0])?.role ?? null;
  const first = groupRow ?? rows[0];

  return {
    group: first ? { id: first.venue_group_id, name: first.group_name } : null,
    groupId: first?.venue_group_id,
    venues,
    venue,
    venueId: venue?.id,
    setVenueId,
    role,
    /** Tarmoq darajasidagi rol (ega/admin): filial qo'shish, xodimlar va hokazo */
    isGroupScoped: !!groupRow,
    can: (p: Permission) => permissions.has(p),
    isLoading: wp.isLoading || (!!groupRow && groupVenues.isLoading),
    error: wp.error ?? groupVenues.error,
    /** Hech qayerda ishlamaydi (yoki ishdan bo'shatilgan) */
    noGroup: wp.isSuccess && rows.length === 0,
    refetch: () => {
      void wp.refetch();
      void groupVenues.refetch();
    },
  };
}
