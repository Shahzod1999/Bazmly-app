import React, { useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ticket, TicketPercent } from "lucide-react-native";
import { EmptyState, ErrorState, Header, Screen, Segmented, Skeleton } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useMyBookings } from "../../api/queries";
import { useIsAuthed } from "../../stores/auth";
import { GuestGate } from "../../features/auth/GuestGate";
import { BookingCard } from "../../features/tickets/BookingCard";
import { ACTIVE_STATUSES } from "../../features/tickets/status";

export default function VouchersScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const authed = useIsAuthed();
  const [tab, setTab] = useState<"tickets" | "vouchers">("tickets");
  const q = useMyBookings();
  const tickets = (q.data ?? [])
    .filter((b) => ACTIVE_STATUSES.includes(b.status))
    .sort((a, b) => a.booking_date.localeCompare(b.booking_date));

  return (
    <Screen padded>
      <Header large title={t("tickets.title")} />
      <Segmented
        options={[
          { value: "tickets", label: t("tickets.tabTickets") },
          { value: "vouchers", label: t("tickets.tabVouchers") },
        ]}
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 16 }}
      />
      {!authed ? (
        <GuestGate redirect="/vouchers" />
      ) : tab === "vouchers" ? (
        // Promokodlar uchun backend API hali yo'q (BACKEND_CONTRACT §5). Web'dagi ro'yxat hardcode edi.
        <EmptyState
          icon={<TicketPercent size={30} color={colors.primary} />}
          title={t("tickets.vouchersEmpty")}
          description={t("tickets.vouchersHint")}
        />
      ) : q.isLoading ? (
        <View style={{ gap: 12 }}>
          <Skeleton height={170} radius={20} />
          <Skeleton height={170} radius={20} />
        </View>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={tickets}
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
              icon={<Ticket size={30} color={colors.primary} />}
              title={t("tickets.empty")}
              description={t("tickets.emptyHint")}
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
            />
          )}
        />
      )}
    </Screen>
  );
}
