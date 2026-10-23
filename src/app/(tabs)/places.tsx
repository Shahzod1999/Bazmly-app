import React, { useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { CalendarCheck } from "lucide-react-native";
import {
  Button,
  EmptyState,
  ErrorState,
  Header,
  Screen,
  Segmented,
  Skeleton,
  errorMessage,
  promptDialog,
  toast,
} from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useCancelBooking, useMyBookings } from "../../api/queries";
import type { BookingListItem } from "../../api";
import { useIsAuthed } from "../../stores/auth";
import { GuestGate } from "../../features/auth/GuestGate";
import { BookingCard } from "../../features/tickets/BookingCard";
import { ACTIVE_STATUSES } from "../../features/tickets/status";
import { toDateOnly } from "../../lib/format";
import { usePrefs } from "../../stores/prefs";

export default function PlacesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const authed = useIsAuthed();
  const [tab, setTab] = useState<"active" | "past">("active");
  const q = useMyBookings();
  const cancel = useCancelBooking();
  const reviewed = usePrefs((s) => s.reviewedBookings);
  const today = toDateOnly(new Date());

  const all = q.data ?? [];
  const active = all
    .filter((b) => ACTIVE_STATUSES.includes(b.status) && b.booking_date >= today)
    .sort((a, b) => a.booking_date.localeCompare(b.booking_date));
  const past = all
    .filter((b) => !active.includes(b))
    .sort((a, b) => b.booking_date.localeCompare(a.booking_date));
  const data = tab === "active" ? active : past;

  const doCancel = async (b: BookingListItem) => {
    const reason = await promptDialog({
      title: t("places.cancelTitle"),
      message: `${b.venue_name}`,
      confirmLabel: t("places.cancel"),
      cancelLabel: t("common.back"),
      destructive: true,
      input: { label: t("places.cancelReason") },
    });
    if (reason === null) return;
    cancel.mutate(
      { id: b.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => toast.success(t("places.cancelled")),
        onError: (e) => toast.error(errorMessage(e, t("common.errorGeneric"))),
      },
    );
  };

  const footer = (b: BookingListItem) => {
    const buttons: React.ReactNode[] = [];
    if (ACTIVE_STATUSES.includes(b.status) && b.status !== "checked_in") {
      buttons.push(
        <Button
          key="ticket"
          title={t("places.openTicket")}
          size="sm"
          variant="soft"
          fullWidth={false}
          style={{ flex: 1 }}
          onPress={() =>
            router.push({ pathname: "/ticket/[bookingId]", params: { bookingId: String(b.id) } })
          }
        />,
        <Button
          key="cancel"
          title={t("common.cancel")}
          size="sm"
          variant="danger"
          fullWidth={false}
          style={{ flex: 1 }}
          onPress={() => doCancel(b)}
        />,
      );
    }
    if (b.status === "completed" && !reviewed.includes(b.id)) {
      buttons.push(
        <Button
          key="review"
          title={t("places.writeReview")}
          size="sm"
          variant="soft"
          onPress={() =>
            router.push({
              pathname: "/review/[bookingId]",
              params: { bookingId: String(b.id), venue: b.venue_name },
            })
          }
        />,
      );
    }
    return buttons.length ? <View style={{ flexDirection: "row", gap: 10 }}>{buttons}</View> : undefined;
  };

  return (
    <Screen>
      <Header large title={t("places.title")} />
      <Segmented
        options={[
          { value: "active", label: `${t("places.active")}${active.length ? ` (${active.length})` : ""}` },
          { value: "past", label: t("places.past") },
        ]}
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 16 }}
      />
      {!authed ? (
        <GuestGate redirect="/places" />
      ) : q.isLoading ? (
        <View style={{ gap: 12 }}>
          <Skeleton height={190} radius={20} />
          <Skeleton height={190} radius={20} />
        </View>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={{ gap: 12, paddingBottom: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => void q.refetch()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<CalendarCheck size={30} color={colors.primary} />}
              title={t("places.empty")}
              description={t("places.emptyHint")}
              actionLabel={t("places.explore")}
              onAction={() => router.navigate("/")}
            />
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() =>
                router.push({ pathname: "/ticket/[bookingId]", params: { bookingId: String(item.id) } })
              }
              footer={footer(item)}
            />
          )}
        />
      )}
    </Screen>
  );
}
