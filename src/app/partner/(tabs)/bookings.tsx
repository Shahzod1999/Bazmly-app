import React, { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  Header,
  Screen,
  Segmented,
  Skeleton,
  Text,
  errorMessage,
  promptDialog,
  toast,
} from "../../../components/ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { radius } from "../../../theme/tokens";
import {
  useCheckOut,
  useConfirmBooking,
  useRejectBooking,
  useTableBoard,
  useVenueBookings,
} from "../../../api/queries";
import type { BookingListItem, BookingStatus } from "../../../api";
import { PartnerGate } from "../../../features/partner/PartnerGate";
import { usePartnerContext } from "../../../features/partner/usePartnerContext";
import { BookingCard } from "../../../features/tickets/BookingCard";
import { formatDate, mondayBasedWeekday, toDateOnly, weekdayShort } from "../../../lib/format";
import { haptic } from "../../../lib/haptics";

export default function PartnerBookings() {
  const { t } = useTranslation();
  const ctx = usePartnerContext();
  const [view, setView] = useState<"list" | "tables">("list");
  return (
    <Screen>
      <Header large title={t("tabs.bookings")} subtitle={ctx.venue?.name} />
      <Segmented
        options={[
          { value: "list", label: t("tabs.bookings") },
          { value: "tables", label: t("partner.tables") },
        ]}
        value={view}
        onChange={setView}
        style={{ marginBottom: 12 }}
      />
      <PartnerGate>
        {(venueId) =>
          view === "list" ? <BookingList venueId={venueId} /> : <TableBoard venueId={venueId} />
        }
      </PartnerGate>
    </Screen>
  );
}

function BookingList({ venueId }: { venueId: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const days = useMemo(() => {
    const out: Date[] = [];
    for (let i = -1; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);
  const [day, setDay] = useState(toDateOnly(new Date()));
  const [status, setStatus] = useState<BookingStatus | undefined>(undefined);
  const q = useVenueBookings(venueId, status, day);
  const confirm = useConfirmBooking();
  const reject = useRejectBooking();
  const checkOut = useCheckOut();
  const ctx = usePartnerContext();

  const onError = (e: unknown) => toast.error(errorMessage(e, t("common.errorGeneric")));

  const actions = (b: BookingListItem) => {
    if (b.status === "pending") {
      if (!ctx.can("bookings.confirm") && !ctx.can("bookings.cancel")) return undefined;
      return (
        <View style={{ flexDirection: "row", gap: 10 }}>
          {ctx.can("bookings.confirm") ? (
            <Button
              title={t("partner.confirm")}
              size="sm"
              fullWidth={false}
              style={{ flex: 1 }}
              loading={confirm.isPending && confirm.variables?.id === b.id}
              onPress={() =>
                confirm.mutate(
                  { id: b.id, venueId },
                  { onSuccess: () => toast.success(t("partner.confirmed")), onError },
                )
              }
            />
          ) : null}
          {ctx.can("bookings.cancel") ? (
            <Button
              title={t("partner.reject")}
              size="sm"
              variant="danger"
              fullWidth={false}
              style={{ flex: 1 }}
              onPress={async () => {
                const reason = await promptDialog({
                  title: t("partner.reject"),
                  confirmLabel: t("partner.reject"),
                  destructive: true,
                  input: { label: t("partner.rejectReason") },
                });
                if (reason === null) return;
                reject.mutate(
                  { id: b.id, venueId, reason: reason.trim() || undefined },
                  { onSuccess: () => toast.success(t("partner.rejected")), onError },
                );
              }}
            />
          ) : null}
        </View>
      );
    }
    if (b.status === "checked_in" && ctx.can("bookings.confirm")) {
      return (
        <Button
          title={t("partner.checkOut")}
          size="sm"
          variant="soft"
          loading={checkOut.isPending && checkOut.variables?.id === b.id}
          onPress={() =>
            checkOut.mutate(
              { id: b.id, venueId },
              {
                onSuccess: (r) => toast.success(t("partner.checkedOut", { minutes: r.seated_minutes ?? 0 })),
                onError,
              },
            )
          }
        />
      );
    }
    return undefined;
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
        style={{ flexGrow: 0 }}
      >
        {days.map((d) => {
          const k = toDateOnly(d);
          const active = k === day;
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={formatDate(k)}
              onPress={() => {
                haptic.selection();
                setDay(k);
              }}
              style={[
                styles.day,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text variant="caption" color={active ? colors.onPrimary : colors.textMuted}>
                {weekdayShort(mondayBasedWeekday(d))}
              </Text>
              <Text variant="h3" color={active ? colors.onPrimary : colors.text}>
                {d.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
        style={{ flexGrow: 0 }}
      >
        <Chip label={t("partner.all")} selected={!status} onPress={() => setStatus(undefined)} />
        {(["pending", "confirmed", "checked_in", "completed", "cancelled"] as BookingStatus[]).map((s) => (
          <Chip key={s} label={t(`status.${s}`)} selected={status === s} onPress={() => setStatus(s)} />
        ))}
      </ScrollView>
      {q.isLoading ? (
        <Skeleton height={180} radius={20} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={{ gap: 12, paddingBottom: 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => void q.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={<EmptyState title={t("partner.bookingsEmpty")} />}
          renderItem={({ item }) => <BookingCard booking={item} footer={actions(item)} />}
        />
      )}
    </View>
  );
}

function TableBoard({ venueId }: { venueId: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const q = useTableBoard(venueId);
  if (q.isLoading) return <Skeleton height={200} radius={20} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data?.length) return <EmptyState title={t("partner.tablesEmpty")} />;
  return (
    <ScrollView
      contentContainerStyle={styles.tables}
      refreshControl={
        <RefreshControl
          refreshing={q.isRefetching}
          onRefresh={() => void q.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      {q.data.map((row) => {
        const busy = !!row.order;
        return (
          <View
            key={row.table_id}
            style={[
              styles.table,
              {
                backgroundColor: busy ? colors.primarySoft : colors.surface,
                borderColor: busy ? colors.primary : colors.border,
              },
            ]}
          >
            <Text variant="display">{row.number}</Text>
            <Text variant="caption" color="textMuted">
              {t("booking.tableSeats", { count: row.seats })}
            </Text>
            <Text variant="caption" color={busy ? "primary" : "success"} style={{ marginTop: 4 }}>
              {busy ? t("partner.tableBusy") : t("partner.tableFree")}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  day: {
    width: 54,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tables: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 24 },
  table: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
