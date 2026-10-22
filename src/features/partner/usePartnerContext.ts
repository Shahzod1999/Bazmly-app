import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { zustandStorage } from "../../lib/storage";
import { useMyGroup, useMyVenues } from "../../api/queries";

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

export function usePartnerContext() {
  const group = useMyGroup();
  const venues = useMyVenues(group.data?.id);
  const selectedId = useBranchStore((s) => s.venueId);
  const setVenueId = useBranchStore((s) => s.setVenueId);
  const list = venues.data ?? [];
  const venue = list.find((v) => v.id === selectedId) ?? list[0] ?? null;
  return {
    group: group.data ?? null,
    groupId: group.data?.id,
    venues: list,
    venue,
    venueId: venue?.id,
    setVenueId,
    isLoading: group.isLoading || (!!group.data && venues.isLoading),
    error: group.error ?? venues.error,
    noGroup: group.isError && (group.error as { status?: number } | null)?.status === 404,
    refetch: () => {
      void group.refetch();
      void venues.refetch();
    },
  };
}
