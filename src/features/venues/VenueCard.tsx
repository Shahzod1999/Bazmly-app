import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Bookmark, MapPin, Percent } from "lucide-react-native";
import type { VenueListItem } from "../../api";
import { Badge, Card, RatingInline, StatusDot, Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { formatDistance, formatMoney } from "../../lib/format";
import { haptic } from "../../lib/haptics";
import { venueImage } from "./images";

/** "Bunyodkor shoh ko'chasi, 12" — backend bermasa null */
function addressOf(v: VenueListItem): string | null {
  const parts = [v.street, v.house_number].filter((x) => x && String(x).trim());
  return parts.length ? parts.join(", ") : null;
}

interface Props {
  venue: VenueListItem;
  onPress: () => void;
  variant?: "large" | "grid" | "row";
  favorite?: boolean;
  onToggleFavorite?: () => void;
}

export function VenueCard({ venue, onPress, variant = "grid", favorite, onToggleFavorite }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const distance = formatDistance(venue.distance_m);
  const img = venueImage(venue.id, venue.cover_url, venue.venue_type);
  const address = addressOf(venue);
  const capacity =
    venue.capacity_min && venue.capacity_max
      ? t("venue.capacityRange", { min: venue.capacity_min, max: venue.capacity_max })
      : null;
  const discount =
    venue.discount_percent && Number(venue.discount_percent) > 0 ? Number(venue.discount_percent) : null;

  const favButton = onToggleFavorite ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("profile.favorites")}
      hitSlop={8}
      onPress={() => {
        haptic.light();
        onToggleFavorite();
      }}
      style={styles.fav}
    >
      <Bookmark size={18} color="#fff" fill={favorite ? "#fff" : "transparent"} />
    </Pressable>
  ) : null;

  if (variant === "row") {
    return (
      <Card onPress={onPress} padded={false} accessibilityLabel={venue.name}>
        <View style={styles.row}>
          <Image source={img} style={styles.rowImg} contentFit="cover" transition={150} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="h3" numberOfLines={1}>
              {venue.name}
            </Text>
            <RatingInline
              rating={venue.rating_avg}
              count={t("home.reviews", { count: venue.reviews_count })}
            />
            {address ? (
              <Text variant="small" color="textMuted" numberOfLines={1}>
                {address}
              </Text>
            ) : null}
            <View style={styles.metaRow}>
              <StatusDot
                open={venue.is_open_now}
                label={venue.is_open_now ? t("common.open") : t("common.closed")}
              />
              {distance ? (
                <Text variant="small" color="textMuted">
                  · {distance}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </Card>
    );
  }

  if (variant === "large") {
    return (
      <Card onPress={onPress} padded={false} accessibilityLabel={venue.name}>
        <View style={{ padding: 10 }}>
          <View>
            <Image source={img} style={styles.largeImg} contentFit="cover" transition={150} />
            {favButton}
            {discount ? (
              <Badge
                label={t("home.discount", { value: discount })}
                tone="primary"
                solid
                style={styles.discount}
              />
            ) : null}
          </View>
          <View style={{ paddingHorizontal: 6, paddingTop: 12, paddingBottom: 6, gap: 6 }}>
            <View style={styles.titleRow}>
              <Text variant="h2" numberOfLines={1} style={{ flex: 1 }}>
                {venue.name}
              </Text>
              <RatingInline
                rating={venue.rating_avg}
                count={t("home.reviews", { count: venue.reviews_count })}
              />
            </View>
            {venue.tagline ? (
              <Text variant="small" color="textMuted" numberOfLines={1}>
                {venue.tagline}
              </Text>
            ) : null}
            {address || capacity ? (
              <View style={styles.inline}>
                {address ? <MapPin size={14} color={colors.textMuted} /> : null}
                <Text variant="small" color="textMuted" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {[address, capacity].filter(Boolean).join(" · ")}
                </Text>
              </View>
            ) : null}
            <View style={styles.metaRow}>
              <StatusDot
                open={venue.is_open_now}
                label={venue.is_open_now ? t("common.open") : t("common.closed")}
              />
              {distance ? (
                <View style={styles.inline}>
                  <MapPin size={14} color={colors.textMuted} />
                  <Text variant="small" color="textMuted">
                    {distance}
                  </Text>
                </View>
              ) : null}
              {venue.requires_deposit ? (
                <Badge
                  label={t("home.deposit")}
                  tone="success"
                  icon={<Percent size={11} color={colors.success} />}
                />
              ) : null}
              {venue.base_price ? (
                <Text variant="smallMedium" style={{ marginLeft: "auto" }}>
                  {t("home.fromPrice", { price: formatMoney(venue.base_price, venue.currency) })}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={onPress} padded={false} style={{ flex: 1 }} accessibilityLabel={venue.name}>
      <View style={{ padding: 8 }}>
        <View>
          <Image source={img} style={styles.gridImg} contentFit="cover" transition={150} />
          {favButton}
        </View>
        <View style={{ paddingHorizontal: 4, paddingTop: 10, gap: 6 }}>
          <View style={styles.titleRow}>
            <Text variant="h3" numberOfLines={1} style={{ flex: 1 }}>
              {venue.name}
            </Text>
            <RatingInline rating={venue.rating_avg} />
          </View>
          <StatusDot
            open={venue.is_open_now}
            label={venue.is_open_now ? t("common.open") : t("common.closed")}
          />
          <View style={styles.metaRow}>
            {distance ? (
              <Text variant="small" color="textMuted">
                {distance}
              </Text>
            ) : null}
            {venue.requires_deposit ? <Badge label={t("home.deposit")} tone="success" /> : null}
          </View>
        </View>
        <View style={[styles.viewBtn, { backgroundColor: colors.primary }]}>
          <Text variant="smallMedium" color={colors.onPrimary}>
            {t("home.view")} →
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  largeImg: { width: "100%", aspectRatio: 16 / 10, borderRadius: radius.lg },
  gridImg: { width: "100%", aspectRatio: 1.1, borderRadius: radius.md },
  row: { flexDirection: "row", gap: 12, padding: 10, alignItems: "center" },
  rowImg: { width: 76, height: 76, borderRadius: radius.md },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  inline: { flexDirection: "row", alignItems: "center", gap: 4 },
  fav: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  discount: { position: "absolute", top: 10, left: 10 },
  viewBtn: {
    marginTop: 10,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
