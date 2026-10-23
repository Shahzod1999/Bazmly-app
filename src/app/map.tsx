import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ChevronLeft, List, LocateFixed } from "lucide-react-native";
import { IconButton, Text, toast } from "../components/ui";
import { useTheme } from "../theme/ThemeProvider";
import { AppMap } from "../components/maps/AppMap";
import { VenueCard } from "../features/venues/VenueCard";
import { useVenueFilters, useVenueList } from "../features/venues/useVenueList";
import { getCurrentLocation, useLocationStore } from "../lib/location";
import { useQueries } from "@tanstack/react-query";
import { qk } from "../api/queries";
import { venueService } from "../api";

// Toshkent markazi — joylashuv noma'lum bo'lsa
const DEFAULT_CENTER = { latitude: 41.3111, longitude: 69.2797 };

/**
 * Xarita rejimi.
 * `VenueListItem` da koordinata yo'q, shuning uchun birinchi 30 ta joy uchun `GET /venues/{id}`
 * so'raladi (natija keshlanadi va venue sahifasida qayta ishlatiladi).
 * Taklif: qidiruv javobiga latitude/longitude qo'shish (BACKEND_CONTRACT → qolgan masalalar §4) — shunda bu so'rovlar kerak bo'lmaydi.
 */
export default function MapScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const query = useVenueFilters((s) => s.query);
  const list = useVenueList(query);
  const coords = useLocationStore((s) => s.coords);
  const details = useQueries({
    queries: list.items.slice(0, 30).map((v) => ({
      queryKey: qk.venue(v.id),
      queryFn: () => venueService.getVenueDetail(v.id),
      staleTime: 5 * 60_000,
    })),
  });
  const [selected, setSelected] = useState<number | null>(null);

  // React Compiler memoizatsiyani o'zi bajaradi; 30 ta element — arzon hisob
  const markers = details
    .map((d) => {
      const v = d.data?.venue;
      if (!v) return null;
      const lat = Number(v.latitude);
      const lng = Number(v.longitude);
      return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0
        ? { id: v.id, latitude: lat, longitude: lng, title: v.name }
        : null;
    })
    .filter(Boolean) as { id: number; latitude: number; longitude: number; title: string }[];
  const center = coords ?? markers[0] ?? DEFAULT_CENTER;
  const selectedVenue = list.items.find((v) => v.id === (selected ?? markers[0]?.id ?? list.items[0]?.id));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppMap
        key={`${center.latitude}-${center.longitude}`}
        latitude={center.latitude}
        longitude={center.longitude}
        delta={0.12}
        markers={markers}
        selectedId={selected}
        onMarkerPress={setSelected}
        showsUserLocation={!!coords}
      />
      <View style={[styles.top, { top: insets.top + 8 }]}>
        <IconButton
          icon={<ChevronLeft size={22} color={colors.text} />}
          accessibilityLabel={t("common.back")}
          onPress={() => router.back()}
        />
        <View style={[styles.pill, { backgroundColor: colors.card }]}>
          <Text variant="smallMedium">{t("home.topVenues")}</Text>
        </View>
        <IconButton
          icon={<LocateFixed size={20} color={colors.primary} />}
          accessibilityLabel={t("home.detectLocation")}
          onPress={async () => {
            const r = await getCurrentLocation();
            if (!r.ok) toast.error(t("home.locationDenied"));
          }}
        />
      </View>
      <View style={[styles.bottom, { bottom: insets.bottom + 16 }]}>
        {selectedVenue ? (
          <VenueCard
            venue={selectedVenue}
            variant="row"
            onPress={() => router.push({ pathname: "/venue/[id]", params: { id: String(selectedVenue.id) } })}
          />
        ) : null}
        <IconButton
          icon={<List size={20} color="#fff" />}
          variant="primary"
          accessibilityLabel={t("home.listView")}
          onPress={() => router.back()}
          style={{ alignSelf: "center", marginTop: 12 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  bottom: { position: "absolute", left: 16, right: 16, maxWidth: 560, alignSelf: "center" },
});
