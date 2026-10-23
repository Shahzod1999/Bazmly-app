import React, { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  Bookmark,
  ChevronLeft,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Percent,
  Phone,
  Share2,
  Users,
  Wallet,
} from "lucide-react-native";
import { Image } from "expo-image";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  RatingInline,
  RatingStars,
  Screen,
  Segmented,
  Sheet,
  Skeleton,
  StatusDot,
  Text,
  toast,
} from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import {
  useFavoriteIds,
  useReviewAggregate,
  useReviews,
  useToggleFavorite,
  useVenue,
  useVenueMenu,
} from "../../api/queries";
import { engagementService } from "../../api";
import { Gallery } from "../../features/venues/Gallery";
import { foodImage, venueImage } from "../../features/venues/images";
import { AppMap } from "../../components/maps/AppMap";
import { requireAuth } from "../../features/auth/redirect";
import { callPhone, openDirections, shareLink } from "../../lib/linking";
import { formatDateTime, formatMoney, formatTime, mondayBasedWeekday, weekdayLong } from "../../lib/format";

type Tab = "info" | "menu" | "reviews";

export default function VenueScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Number(idParam);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const venueQ = useVenue(id);
  const agg = useReviewAggregate(id);
  const favIds = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const [tab, setTab] = useState<Tab>("info");
  const [dirOpen, setDirOpen] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  const detail = venueQ.data;
  const v = detail?.venue;
  const isHall = detail?.venue_type === "toyxona" || v?.venue_type === "toyxona";
  // To'yxona narxi bosqichlardan: eng arzon bosqich "…dan" sifatida ko'rsatiladi
  const tierPrices = (detail?.guest_tiers ?? []).map((tr) => Number(tr.base_price)).filter((n) => n > 0);
  const priceFrom = tierPrices.length ? String(Math.min(...tierPrices)) : (v?.base_price ?? null);
  const menu = useVenueMenu(!isHall && tab === "menu" ? id : 0);
  const reviews = useReviews(tab === "reviews" ? id : 0);

  const images = useMemo(() => {
    if (!detail) return [];
    const photos = [...detail.photos].sort(
      (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
    );
    if (photos.length) return photos.map((p) => ({ uri: p.url }));
    return [venueImage(id, null, detail.venue_type)];
  }, [detail, id]);

  if (venueQ.isLoading) {
    return (
      <Screen edges={[]} padded={false}>
        <Skeleton height={320} radius={0} />
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton height={28} width="70%" />
          <Skeleton height={16} width="45%" />
          <Skeleton height={120} />
          <Skeleton height={220} />
        </View>
      </Screen>
    );
  }

  if (venueQ.isError || !v || !detail) {
    return (
      <Screen>
        <View style={{ paddingTop: 12 }}>
          <IconButton
            icon={<ChevronLeft size={22} color={colors.text} />}
            accessibilityLabel={t("common.back")}
            onPress={() => router.back()}
          />
        </View>
        <ErrorState error={venueQ.error} onRetry={() => venueQ.refetch()} />
      </Screen>
    );
  }

  const isFav = favIds.has(id);
  const discount = v.discount_percent && Number(v.discount_percent) > 0 ? Number(v.discount_percent) : null;
  const rating = agg.data?.average ?? v.rating_avg;
  const reviewsCount = agg.data?.count ?? v.reviews_count;
  const lat = Number(v.latitude);
  const lng = Number(v.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
  const address = [v.street, v.house_number].filter(Boolean).join(", ");
  const today = mondayBasedWeekday(new Date());

  const book = () => {
    const path = isHall ? `/book/hall/${id}` : `/book/table/${id}`;
    if (!requireAuth(path)) return;
    router.push(path as never);
  };

  const message = async () => {
    if (!requireAuth(`/venue/${id}`)) return;
    setMsgLoading(true);
    try {
      const conv = await engagementService.createConversation(id);
      router.push({ pathname: "/messages/[id]", params: { id: String(conv.id), venue: v.name } });
    } catch {
      toast.error(t("common.errorGeneric"));
    } finally {
      setMsgLoading(false);
    }
  };

  const fav = () => {
    if (!requireAuth(`/venue/${id}`)) return;
    toggleFav.mutate(id, {
      onSuccess: (r) => toast.success(r.is_favorite ? t("venue.favoriteAdded") : t("venue.favoriteRemoved")),
    });
  };

  const tabs: { value: Tab; label: string }[] = [
    { value: "info", label: t("venue.about") },
    ...(!isHall ? [{ value: "menu" as Tab, label: t("venue.menu") }] : []),
    { value: "reviews", label: t("venue.reviews") },
  ];

  return (
    <Screen
      scroll
      edges={[]}
      padded={false}
      onRefresh={() => {
        void venueQ.refetch();
        void agg.refetch();
      }}
      refreshing={venueQ.isRefetching}
      footer={
        <View style={styles.footer}>
          {isHall && priceFrom ? (
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="textMuted">
                {t("venue.price")}
              </Text>
              <Text variant="h2" numberOfLines={1} tabular>
                {t("home.fromPrice", { price: formatMoney(priceFrom, v.currency) })}
              </Text>
            </View>
          ) : null}
          <Button
            title={isHall ? t("venue.book") : t("venue.bookTable")}
            size="lg"
            onPress={book}
            fullWidth={false}
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <View>
        <Gallery images={images} height={Math.min(340, width * 0.85)} />
        <View style={[styles.overlay, { top: insets.top + 8 }]}>
          <IconButton
            icon={<ChevronLeft size={22} color="#fff" />}
            variant="overlay"
            accessibilityLabel={t("common.back")}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <IconButton
              icon={<Share2 size={20} color="#fff" />}
              variant="overlay"
              accessibilityLabel={t("common.share")}
              onPress={() =>
                shareLink(
                  t("venue.shareText", { name: v.name, url: "" }).trim(),
                  `/${isHall ? "hall" : "venue"}/${id}`,
                )
              }
            />
            <IconButton
              icon={<Bookmark size={20} color="#fff" fill={isFav ? "#fff" : "transparent"} />}
              variant="overlay"
              accessibilityLabel={t("profile.favorites")}
              onPress={fav}
            />
          </View>
        </View>
      </View>

      <View style={[styles.body, { backgroundColor: colors.background }]}>
        <View style={styles.badges}>
          {discount ? (
            <Badge
              label={t("home.discount", { value: discount })}
              tone="primary"
              icon={<Percent size={11} color={colors.primary} />}
            />
          ) : null}
          <Badge
            label={v.requires_deposit ? t("home.deposit") : t("home.noDeposit")}
            tone={v.requires_deposit ? "success" : "neutral"}
          />
          <Pressable onPress={() => setTab("reviews")} style={{ marginLeft: "auto" }} hitSlop={8}>
            <RatingInline rating={rating} count={t("home.reviews", { count: reviewsCount })} />
          </Pressable>
        </View>

        <View style={styles.titleRow}>
          <Text variant="display" style={{ flex: 1 }}>
            {v.name}
          </Text>
          <StatusDot
            open={!!detail.is_open_now}
            label={detail.is_open_now ? t("common.open") : t("common.closed")}
          />
        </View>
        {v.tagline ? (
          <Text variant="body" color="textMuted" style={{ marginTop: 4 }}>
            {v.tagline}
          </Text>
        ) : null}

        <View style={{ gap: 10, marginTop: 16 }}>
          {v.capacity_min || v.capacity_max || v.total_seats ? (
            <InfoLine
              icon={<Users size={18} color={colors.primary} />}
              text={
                v.capacity_min && v.capacity_max
                  ? `${t("venue.capacity")}: ${t("venue.capacityRange", { min: v.capacity_min, max: v.capacity_max })}`
                  : `${t("venue.capacity")}: ${t("venue.seats", { count: v.capacity_max ?? v.total_seats ?? 0 })}`
              }
            />
          ) : null}
          {priceFrom ? (
            <InfoLine
              icon={<Wallet size={18} color={colors.primary} />}
              text={`${t("venue.price")}: ${t("home.fromPrice", { price: formatMoney(priceFrom, v.currency) })}`}
            />
          ) : null}
          {v.requires_deposit && v.deposit_percent ? (
            <InfoLine
              icon={<Percent size={18} color={colors.primary} />}
              text={t("venue.depositPercent", { value: Number(v.deposit_percent) })}
            />
          ) : null}
          {address ? <InfoLine icon={<MapPin size={18} color={colors.primary} />} text={address} /> : null}
        </View>

        <View style={styles.actions}>
          <Button
            title={t("common.call")}
            variant="secondary"
            icon={<Phone size={18} color={colors.success} />}
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={() => v.phone && callPhone(v.phone)}
            disabled={!v.phone}
          />
          <Button
            title={t("venue.message")}
            variant="soft"
            icon={<MessageCircle size={18} color={colors.primary} />}
            fullWidth={false}
            style={{ flex: 1 }}
            loading={msgLoading}
            onPress={message}
          />
        </View>

        <Segmented options={tabs} value={tab} onChange={setTab} style={{ marginTop: 24 }} />

        {tab === "info" ? (
          <View style={{ marginTop: 20, gap: 24 }}>
            {v.description ? (
              <View>
                <Text variant="h2" style={{ marginBottom: 8 }}>
                  {t("venue.about")}
                </Text>
                <Text variant="body" color="textMuted">
                  {v.description}
                </Text>
              </View>
            ) : null}

            {detail.amenities.length ? (
              <View>
                <Text variant="h2" style={{ marginBottom: 12 }}>
                  {t("venue.amenities")}
                </Text>
                <View style={styles.amenities}>
                  {detail.amenities.map((a) => (
                    <View
                      key={a.id}
                      style={[styles.amenity, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      {a.icon_url ? (
                        <Image
                          source={{ uri: a.icon_url }}
                          style={{ width: 22, height: 22 }}
                          contentFit="contain"
                        />
                      ) : (
                        <View style={[styles.amenityDot, { backgroundColor: colors.primarySoft }]} />
                      )}
                      <Text variant="smallMedium" numberOfLines={2} style={{ flex: 1 }}>
                        {a.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {detail.working_hours.length ? (
              <View>
                <Text variant="h2" style={{ marginBottom: 8 }}>
                  {t("venue.workingHours")}
                </Text>
                <Card padded>
                  {[...detail.working_hours]
                    .sort((a, b) => a.weekday - b.weekday)
                    .map((h) => (
                      <View key={h.weekday} style={styles.hourRow}>
                        <Clock size={14} color={h.weekday === today ? colors.primary : colors.textSubtle} />
                        <Text
                          variant={h.weekday === today ? "smallMedium" : "small"}
                          color={h.weekday === today ? "primary" : "text"}
                          style={{ flex: 1 }}
                        >
                          {weekdayLong(h.weekday)}
                        </Text>
                        <Text variant="smallMedium" color={h.is_closed ? "danger" : "text"} tabular>
                          {h.is_closed
                            ? t("venue.closedDay")
                            : `${formatTime(h.opens_at)} – ${formatTime(h.closes_at)}`}
                        </Text>
                      </View>
                    ))}
                </Card>
              </View>
            ) : null}

            {hasCoords ? (
              <View>
                <Text variant="h2" style={{ marginBottom: 8 }}>
                  {t("venue.address")}
                </Text>
                <View style={[styles.map, { borderColor: colors.border }]}>
                  <AppMap
                    latitude={lat}
                    longitude={lng}
                    delta={0.01}
                    markers={[{ id, latitude: lat, longitude: lng, title: v.name }]}
                    interactive={false}
                  />
                </View>
                <Button
                  title={t("venue.directions")}
                  variant="outline"
                  icon={<Navigation size={18} color={colors.primary} />}
                  onPress={() =>
                    Platform.OS === "web" ? openDirections(lat, lng, v.name, "google") : setDirOpen(true)
                  }
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {tab === "menu" ? (
          <View style={{ marginTop: 20 }}>
            {menu.isLoading ? (
              <View style={{ gap: 12 }}>
                <Skeleton height={84} />
                <Skeleton height={84} />
              </View>
            ) : menu.isError ? (
              <ErrorState error={menu.error} onRetry={() => menu.refetch()} />
            ) : !menu.data?.length ? (
              <EmptyState title={t("venue.menuEmpty")} />
            ) : (
              <View style={{ gap: 20 }}>
                {groupByCategory(menu.data).map(([category, items]) => (
                  <View key={category} style={{ gap: 10 }}>
                    <Text variant="h3">{category}</Text>
                    <View style={styles.menuGrid}>
                      {items.map((m) => (
                        <Card key={m.id} padded={false} style={styles.menuCard}>
                          <Image
                            source={foodImage(m.id, m.photo_url)}
                            style={styles.menuImg}
                            contentFit="cover"
                            transition={150}
                          />
                          <View style={{ padding: 12, gap: 4 }}>
                            <Text variant="h3" tabular numberOfLines={1}>
                              {m.effective_price
                                ? formatMoney(m.effective_price, m.currency)
                                : m.price_from
                                  ? t("home.fromPrice", { price: formatMoney(m.price_from, m.currency) })
                                  : "—"}
                            </Text>
                            <Text variant="smallMedium" numberOfLines={2}>
                              {m.name}
                            </Text>
                            {m.description ? (
                              <Text variant="caption" color="textMuted" numberOfLines={2}>
                                {m.description}
                              </Text>
                            ) : null}
                            {!m.is_available ? <Badge label={t("venue.unavailable")} tone="danger" /> : null}
                          </View>
                        </Card>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {tab === "reviews" ? (
          <View style={{ marginTop: 20, gap: 12 }}>
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <Text variant="display">{Number(rating || 0).toFixed(1)}</Text>
                <View style={{ gap: 4 }}>
                  <RatingStars value={Math.round(Number(rating || 0))} size={18} />
                  <Text variant="small" color="textMuted">
                    {t("home.reviews", { count: reviewsCount })}
                  </Text>
                </View>
              </View>
            </Card>
            {reviews.isLoading ? (
              <Skeleton height={100} />
            ) : reviews.isError ? (
              <ErrorState error={reviews.error} onRetry={() => reviews.refetch()} />
            ) : !reviews.data?.items.length ? (
              <EmptyState title={t("venue.reviewsEmpty")} />
            ) : (
              reviews.data.items.map((r) => (
                <Card key={r.id}>
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    <Avatar
                      uri={r.author.avatar_url}
                      firstName={r.author.first_name}
                      lastName={r.author.last_name}
                      size={40}
                    />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium">
                        {r.author.first_name} {r.author.last_name}
                      </Text>
                      <Text variant="caption" color="textMuted">
                        {formatDateTime(r.published_at)}
                      </Text>
                    </View>
                    <RatingStars value={r.rating} size={14} />
                  </View>
                  {r.comment ? (
                    <Text variant="body" style={{ marginTop: 10 }}>
                      {r.comment}
                    </Text>
                  ) : null}
                </Card>
              ))
            )}
          </View>
        ) : null}
      </View>

      <Sheet visible={dirOpen} onClose={() => setDirOpen(false)} title={t("venue.openIn")}>
        <View style={{ gap: 10 }}>
          <Button
            title={t("venue.googleMaps")}
            variant="secondary"
            onPress={() => {
              setDirOpen(false);
              void openDirections(lat, lng, v.name, "google");
            }}
          />
          <Button
            title={t("venue.yandexNavi")}
            variant="secondary"
            onPress={() => {
              setDirOpen(false);
              void openDirections(lat, lng, v.name, "yandex");
            }}
          />
          {Platform.OS === "ios" ? (
            <Button
              title={t("venue.appleMaps")}
              variant="secondary"
              onPress={() => {
                setDirOpen(false);
                void openDirections(lat, lng, v.name, "apple");
              }}
            />
          ) : null}
        </View>
      </Sheet>
    </Screen>
  );
}

function InfoLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.infoLine}>
      {icon}
      <Text variant="body" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

/** Menyu elementlarini backend kategoriyasi bo'yicha, kelish tartibida guruhlaydi */
function groupByCategory<T extends { category_name: string }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const key = it.category_name || "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(it);
  }
  return [...map.entries()];
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  body: {
    marginTop: -24,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: 20,
    paddingTop: 22,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  badges: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  infoLine: { flexDirection: "row", alignItems: "center", gap: 10 },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
  amenities: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  amenity: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  amenityDot: { width: 22, height: 22, borderRadius: 11 },
  hourRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  map: { height: 180, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1 },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  menuCard: { width: "48%" },
  menuImg: { width: "100%", aspectRatio: 1.3 },
  footer: { flexDirection: "row", alignItems: "center", gap: 16 },
});
