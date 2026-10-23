import { useMemo } from "react";
import { create } from "zustand";
import type { VenueListItem, VenueSearchParams } from "../../api";
import { useVenueSearch } from "../../api/queries";
import { usePrefs } from "../../stores/prefs";
import { useLocationStore } from "../../lib/location";
import { DEFAULT_FILTERS, type VenueFilters } from "./FilterSheet";

interface FilterStore {
  filters: VenueFilters;
  query: string;
  setFilters: (f: VenueFilters) => void;
  setQuery: (q: string) => void;
}

/** Bosh sahifa va xarita bir xil filtrlardan foydalanadi */
export const useVenueFilters = create<FilterStore>((set) => ({
  filters: DEFAULT_FILTERS,
  query: "",
  setFilters: (filters) => set({ filters }),
  setQuery: (query) => set({ query }),
}));

export function useVenueList(debouncedQuery: string) {
  const filters = useVenueFilters((s) => s.filters);
  const districtId = usePrefs((s) => s.districtId);
  const coords = useLocationStore((s) => s.coords);

  const params: VenueSearchParams = {
    query: debouncedQuery.trim() || undefined,
    venue_type: filters.venueType ?? undefined,
    district_id: districtId ?? undefined,
    guest_count: filters.guests ?? undefined,
    min_rating: filters.minRating ?? undefined,
    requires_deposit: filters.onlyDeposit ? true : undefined,
    only_open_now: filters.onlyOpen ? true : undefined,
    latitude: coords?.latitude,
    longitude: coords?.longitude,
    // Backend saralashi: rating (standart) | price | distance (koordinata bilan)
    sort:
      filters.sort === "price"
        ? "price"
        : filters.sort === "distance" && coords
          ? "distance"
          : filters.sort === "rating"
            ? "rating"
            : undefined,
  };
  const query = useVenueSearch(params);

  // Saralash backend'da (sahifalash bilan to'g'ri ishlashi uchun); bu yerda faqat takrorlarni olib tashlaymiz
  const items = useMemo(() => {
    const all: VenueListItem[] = (query.data?.pages ?? []).flatMap((p) => p.items);
    return Array.from(new Map(all.map((v) => [v.id, v])).values());
  }, [query.data]);

  return { ...query, items, filters };
}
