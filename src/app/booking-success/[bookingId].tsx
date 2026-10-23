import React, { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react-native";
import { Button, ErrorState, Screen, Skeleton, Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useBooking } from "../../api/queries";
import { TicketCard } from "../../features/tickets/TicketCard";
import { PushPrompt } from "../../features/notifications/PushPrompt";
import { DepositNotice } from "../../features/booking/DepositNotice";
import { haptic } from "../../lib/haptics";

export default function PaymentSuccessScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const q = useBooking(Number(bookingId));
  const [scale] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    haptic.success();
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 9, stiffness: 160 }).start();
  }, [scale]);

  return (
    <Screen
      scroll
      footer={
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button
            title={t("payment.toHome")}
            variant="secondary"
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={() => router.replace("/")}
          />
          <Button
            title={t("payment.myTickets")}
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={() => router.replace("/vouchers")}
          />
        </View>
      }
    >
      <View style={{ alignItems: "center", paddingTop: 32 }}>
        <Animated.View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors.successSoft,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale }],
          }}
        >
          <Check size={48} color={colors.success} strokeWidth={3} />
        </Animated.View>
        <Text variant="display" align="center" style={{ marginTop: 20 }}>
          {t("booking.requestSent")}
        </Text>
        <Text variant="body" color="textMuted" align="center" style={{ marginTop: 8, maxWidth: 320 }}>
          {t("booking.requestSentText")}
        </Text>
      </View>
      <View style={{ marginTop: 28 }}>
        {q.isLoading ? (
          <Skeleton height={480} radius={28} />
        ) : q.isError || !q.data ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : (
          <View style={{ gap: 14 }}>
            <DepositNotice booking={q.data.booking} />
            <TicketCard detail={q.data} compact />
          </View>
        )}
      </View>
      <PushPrompt />
    </Screen>
  );
}
