import React from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Share2 } from "lucide-react-native";
import { Button, ErrorState, Header, IconButton, Screen, Skeleton, Text, Card } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useBooking } from "../../api/queries";
import { TicketCard } from "../../features/tickets/TicketCard";
import { useMaxBrightness } from "../../features/tickets/useMaxBrightness";
import { PriceLines } from "../../features/booking/PriceLines";
import { shareLink } from "../../lib/linking";
import { useIsAuthed } from "../../stores/auth";
import { requireAuth } from "../../features/auth/redirect";

export default function TicketScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const id = Number(bookingId);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const authed = useIsAuthed();
  const q = useBooking(id);
  useMaxBrightness(!!q.data);

  if (!authed) {
    return (
      <Screen>
        <Header title={t("tickets.official")} />
        <Text variant="body" color="textMuted">
          {t("common.loginRequired")}
        </Text>
        <Button
          title={t("common.login")}
          style={{ marginTop: 16 }}
          onPress={() => requireAuth(`/ticket/${id}`)}
        />
      </Screen>
    );
  }

  const b = q.data?.booking;
  const payable = b && Number(b.deposit_amount) > 0 && b.status === "pending";

  return (
    <Screen
      scroll
      onRefresh={() => q.refetch()}
      refreshing={q.isRefetching}
      footer={
        payable ? (
          <Button
            title={t("booking.payDeposit")}
            size="lg"
            onPress={() =>
              router.push({ pathname: "/payment/[bookingId]", params: { bookingId: String(id) } })
            }
          />
        ) : undefined
      }
    >
      <Header
        title={t("tickets.official")}
        right={
          q.data ? (
            <IconButton
              icon={<Share2 size={20} color={colors.text} />}
              accessibilityLabel={t("common.share")}
              onPress={() => shareLink(`${q.data!.venue_name} — ${b?.booking_date}`, `/ticket/${id}`)}
            />
          ) : undefined
        }
      />
      {q.isLoading ? (
        <Skeleton height={520} radius={28} />
      ) : q.isError || !q.data ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <View style={{ gap: 16 }}>
          <TicketCard detail={q.data} />
          <Text variant="small" color="textMuted" align="center">
            {t("tickets.showAtEntrance")}
          </Text>
          <Card>
            <PriceLines detail={q.data} />
          </Card>
        </View>
      )}
    </Screen>
  );
}
