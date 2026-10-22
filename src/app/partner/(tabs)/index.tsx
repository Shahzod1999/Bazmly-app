import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ArrowDownRight, ArrowUpRight, Bell, ChevronRight } from "lucide-react-native";
import { Card, ErrorState, IconButton, Screen, SectionTitle, Skeleton, Text } from "../../../components/ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { radius } from "../../../theme/tokens";
import { useDashboard, useUnreadCount, useVenueBookings } from "../../../api/queries";
import { BranchHeader } from "../../../features/partner/BranchHeader";
import { PartnerGate } from "../../../features/partner/PartnerGate";
import { usePartnerContext } from "../../../features/partner/usePartnerContext";
import { BookingCard } from "../../../features/tickets/BookingCard";
import { formatMoneyCompact, groupDigits, toDateOnly, weekdayShort } from "../../../lib/format";

export default function PartnerDashboard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const ctx = usePartnerContext();
  const dash = useDashboard(ctx.groupId, ctx.venueId);
  const today = useVenueBookings(ctx.venueId, undefined, toDateOnly(new Date()));
  const unread = useUnreadCount();
  const d = dash.data;

  return (
    <Screen
      scroll
      onRefresh={() => {
        ctx.refetch();
        void dash.refetch();
        void today.refetch();
      }}
      refreshing={dash.isRefetching}
    >
      <BranchHeader
        isOpen={d?.is_open_now}
        right={
          <IconButton
            icon={<Bell size={22} color={colors.text} />}
            accessibilityLabel={t("notifications.title")}
            badge={unread.data && unread.data > 0 ? unread.data : false}
            onPress={() => router.push("/notifications")}
          />
        }
      />
      <PartnerGate>
        {() =>
          dash.isLoading ? (
            <View style={{ gap: 12 }}>
              <Skeleton height={130} radius={24} />
              <Skeleton height={220} radius={24} />
            </View>
          ) : dash.isError || !d ? (
            <ErrorState error={dash.error} onRetry={() => dash.refetch()} />
          ) : (
            <View>
              <Pressable
                onPress={() => router.navigate("/partner/bookings")}
                accessibilityRole="button"
                style={[styles.queue, { backgroundColor: colors.primary }]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text variant="caption" color="rgba(255,255,255,0.85)" style={{ flex: 1 }}>
                    {t("partner.pendingBookings").toUpperCase()}
                  </Text>
                  <ChevronRight size={18} color="#fff" />
                </View>
                <Text variant="display" color="#fff" style={{ fontSize: 40, lineHeight: 46, marginTop: 6 }}>
                  {d.queue_count}
                </Text>
              </Pressable>

              <View style={styles.kpis}>
                <Kpi
                  label={t("partner.monthRevenue")}
                  value={formatMoneyCompact(d.month_revenue, d.currency)}
                  delta={d.comparison.revenue_delta_percent}
                />
                <Kpi
                  label={t("partner.monthBookings")}
                  value={groupDigits(d.month_bookings)}
                  delta={d.comparison.bookings_delta_percent}
                />
                <Kpi label={t("partner.avgCheck")} value={formatMoneyCompact(d.avg_check, d.currency)} />
                <Kpi
                  label={t("partner.occupancy")}
                  value={`${Math.round(Number(d.occupancy_percent || 0))}%`}
                />
              </View>

              <SectionTitle title={t("partner.weekBookings")} />
              <Card>
                <WeekBars week={d.week} />
              </Card>

              <SectionTitle
                title={t("partner.today")}
                action={t("common.seeAll")}
                onAction={() => router.navigate("/partner/bookings")}
              />
              {today.isLoading ? (
                <Skeleton height={160} radius={20} />
              ) : !today.data?.length ? (
                <Card>
                  <Text variant="body" color="textMuted" align="center">
                    {t("partner.bookingsEmpty")}
                  </Text>
                </Card>
              ) : (
                <View style={{ gap: 12 }}>
                  {today.data.slice(0, 3).map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </View>
              )}
            </View>
          )
        }
      </PartnerGate>
    </Screen>
  );
}

function Kpi({ label, value, delta }: { label: string; value: string; delta?: string | null }) {
  const { colors } = useTheme();
  const n = delta !== null && delta !== undefined ? Number(delta) : null;
  const up = n !== null && n >= 0;
  return (
    <Card style={styles.kpi}>
      <Text variant="caption" color="textMuted" numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
      <Text variant="h2" numberOfLines={1} adjustsFontSizeToFit tabular style={{ marginTop: 6 }}>
        {value}
      </Text>
      {n !== null && Number.isFinite(n) ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginTop: 4 }}>
          {up ? (
            <ArrowUpRight size={14} color={colors.success} />
          ) : (
            <ArrowDownRight size={14} color={colors.danger} />
          )}
          <Text variant="caption" color={up ? "success" : "danger"}>
            {Math.abs(n).toFixed(0)}%
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function WeekBars({ week }: { week: { weekday: number; bookings_count: number }[] }) {
  const { colors } = useTheme();
  const max = Math.max(1, ...week.map((w) => w.bookings_count));
  const todayIdx = (new Date().getDay() + 6) % 7;
  const sorted = [...week].sort((a, b) => a.weekday - b.weekday);
  return (
    <View
      style={styles.bars}
      accessibilityLabel={sorted.map((w) => `${weekdayShort(w.weekday)} ${w.bookings_count}`).join(", ")}
    >
      {sorted.map((w) => {
        const h = Math.max(6, (w.bookings_count / max) * 120);
        const isToday = w.weekday === todayIdx;
        return (
          <View key={w.weekday} style={styles.barCol}>
            <Text variant="caption" color={isToday ? "primary" : "textMuted"} tabular>
              {w.bookings_count}
            </Text>
            <View
              style={[
                styles.bar,
                { height: h, backgroundColor: isToday ? colors.primary : colors.primarySoft },
              ]}
            />
            <Text variant="caption" color={isToday ? "primary" : "textMuted"}>
              {weekdayShort(w.weekday)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  queue: { borderRadius: radius.xxl, padding: 20 },
  kpis: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },
  kpi: { width: "48%", flexGrow: 1 },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 170,
    paddingTop: 8,
  },
  barCol: { alignItems: "center", gap: 6, flex: 1 },
  bar: { width: 22, borderRadius: 8 },
});
