import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Bell, ChevronDown, Map as MapIcon, MapPin, Search, SlidersHorizontal, X } from "lucide-react-native";
import { Chip, EmptyState, ErrorState, IconButton, SectionTitle, Skeleton, Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { MAX_CONTENT_WIDTH, fonts, radius } from "../../theme/tokens";
import { useAuth } from "../../stores/auth";
import { usePrefs } from "../../stores/prefs";
import { useFavoriteIds, useToggleFavorite, useUnreadCount } from "../../api/queries";
import { requireAuth } from "../../features/auth/redirect";
import { VenueCard } from "../../features/venues/VenueCard";
import { PromoCarousel } from "../../features/venues/PromoCarousel";
import { LocationSheet } from "../../features/venues/LocationSheet";
import { FilterSheet, activeFilterCount } from "../../features/venues/FilterSheet";
import { useVenueFilters, useVenueList } from "../../features/venues/useVenueList";
import { useDebounced } from "../../lib/useDebounced";
import { useFont } from "../../theme/fontFamily";
import { getLocationIfGranted } from "../../lib/location";

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 11) return "home.greetingMorning";
  if (h < 18) return "home.greetingDay";
  return "home.greetingEvening";
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const districtLabel = usePrefs((s) => s.districtLabel);
  const { filters, setFilters, query, setQuery } = useVenueFilters();
  const debounced = useDebounced(query);
  const list = useVenueList(debounced);
  const unread = useUnreadCount();
  const favIds = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const [locOpen, setLocOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const searchFont = useFont(fonts.medium);

  useEffect(() => {
    void getLocationIfGranted();
  }, []);

  const greeting = t(greetingKey());
  const title = user?.first_name
    ? t("home.greetingName", { greeting, name: user.first_name })
    : t("home.greetingGuest", { greeting });
  const filterCount = activeFilterCount(filters);
  const [first, ...rest] = list.items;

  const openVenue = (id: number) => router.push({ pathname: "/venue/[id]", params: { id: String(id) } });
  const fav = (id: number) => {
    if (!requireAuth("/")) return;
    toggleFav.mutate(id);
  };

  const header = (
    <View>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text variant="h1" numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            onPress={() => setLocOpen(true)}
            style={styles.location}
            accessibilityRole="button"
            hitSlop={6}
          >
            <MapPin size={15} color={colors.primary} />
            <Text variant="smallMedium" color="textMuted" numberOfLines={1} style={{ flexShrink: 1 }}>
              {districtLabel ?? t("home.allDistricts")}
            </Text>
            <ChevronDown size={15} color={colors.textMuted} />
          </Pressable>
        </View>
        <IconButton
          icon={<Bell size={22} color={colors.text} />}
          accessibilityLabel={t("notifications.title")}
          badge={unread.data && unread.data > 0 ? unread.data : false}
          onPress={() => (requireAuth("/notifications") ? router.push("/notifications") : undefined)}
        />
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={20} color={colors.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("home.searchPlaceholder")}
            placeholderTextColor={colors.textSubtle}
            style={[styles.searchInput, { color: colors.text, fontFamily: searchFont }]}
            returnKeyType="search"
            accessibilityLabel={t("common.search")}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityLabel={t("common.close")}>
              <X size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setFilterOpen(true)}
          style={[styles.filterBtn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={t("filters.title")}
        >
          <SlidersHorizontal size={22} color="#fff" />
          {filterCount ? (
            <View style={[styles.filterBadge, { backgroundColor: colors.card }]}>
              <Text variant="caption" color="primary">
                {filterCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip
          label={t("home.catAll")}
          selected={!filters.venueType}
          onPress={() => setFilters({ ...filters, venueType: null })}
        />
        <Chip
          label={t("home.catRestaurants")}
          selected={filters.venueType === "restoran"}
          onPress={() => setFilters({ ...filters, venueType: "restoran" })}
        />
        <Chip
          label={t("home.catHalls")}
          selected={filters.venueType === "toyxona"}
          onPress={() => setFilters({ ...filters, venueType: "toyxona" })}
        />
        <Chip
          label={t("home.mapView")}
          icon={<MapIcon size={16} color={colors.text} />}
          onPress={() => router.push("/map")}
        />
      </ScrollView>

      {!query && filterCount === 0 ? (
        <>
          <SectionTitle title={t("home.bestOffers")} />
          <PromoCarousel />
        </>
      ) : null}

      <SectionTitle title={t("home.topVenues")} />

      {list.isLoading ? (
        <View style={{ gap: 14 }}>
          <Skeleton height={260} radius={20} />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Skeleton height={220} radius={20} style={{ flex: 1 }} />
            <Skeleton height={220} radius={20} style={{ flex: 1 }} />
          </View>
        </View>
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : list.items.length === 0 ? (
        <EmptyState
          title={t("home.noVenues")}
          description={t("home.noVenuesHint")}
          actionLabel={t("home.resetFilters")}
          onAction={() => {
            setQuery("");
            setFilters({
              ...filters,
              venueType: null,
              guests: null,
              minRating: null,
              onlyDeposit: false,
              onlyOpen: false,
            });
          }}
        />
      ) : first ? (
        <View style={{ marginBottom: 12 }}>
          <VenueCard
            venue={{ ...first, venue_type: filters.venueType ?? first.venue_type }}
            variant="large"
            onPress={() => openVenue(first.id)}
            favorite={favIds.has(first.id)}
            onToggleFavorite={() => fav(first.id)}
          />
        </View>
      ) : null}
    </View>
  );

  // Qolgan joylar 2 ustunli grid
  const rows: (typeof rest)[] = [];
  for (let i = 0; i < rest.length; i += 2) rows.push(rest.slice(i, i + 2));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <FlatList
        data={list.isLoading || list.isError ? [] : rows}
        keyExtractor={(r) => r.map((v) => v.id).join("-")}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={styles.gridRow}>
            {item.map((v) => (
              <VenueCard
                key={v.id}
                venue={{ ...v, venue_type: filters.venueType ?? v.venue_type }}
                onPress={() => openVenue(v.id)}
                favorite={favIds.has(v.id)}
                onToggleFavorite={() => fav(v.id)}
              />
            ))}
            {item.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </View>
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
        }}
        ListFooterComponent={
          list.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={{ margin: 16 }} />
          ) : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching && !list.isFetchingNextPage}
            onRefresh={() => void list.refetch()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
      <LocationSheet visible={locOpen} onClose={() => setLocOpen(false)} />
      <FilterSheet
        visible={filterOpen}
        value={filters}
        onApply={setFilters}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 12 },
  location: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  searchRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 54,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 18,
  },
  searchInput: { flex: 1, fontFamily: fonts.medium, fontSize: 15, height: 52 },
  filterBtn: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: { gap: 8, paddingVertical: 16, paddingRight: 20 },
  gridRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
});
