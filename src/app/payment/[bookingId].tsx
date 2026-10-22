import React, { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, ShieldCheck } from "lucide-react-native";
import {
  Button,
  Card,
  ErrorState,
  Header,
  KeyValue,
  OTPInput,
  Screen,
  Sheet,
  Skeleton,
  Text,
  errorMessage,
  toast,
} from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { qk, useBooking, useCards } from "../../api/queries";
import { paymentService } from "../../api";
import { MOCK_PAYMENTS } from "../../api/config.flags";
import { AddCardSheet } from "../../features/payments/AddCardSheet";
import { CardTile, PayHero } from "../../features/payments/CardTile";
import { PriceLines } from "../../features/booking/PriceLines";
import { formatDate, formatMoney, formatTime } from "../../lib/format";

export default function PaymentScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const id = Number(bookingId);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const bookingQ = useBooking(id);
  const cards = useCards();
  const [pickedCardId, setCardId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payment, setPayment] = useState<{ id: string; phone?: string } | null>(null);
  const [code, setCode] = useState("");

  // Foydalanuvchi tanlamagan bo'lsa — asosiy (yoki birinchi) karta
  const defaultCard = cards.data?.find((c) => c.is_default) ?? cards.data?.[0];
  const cardId = pickedCardId ?? defaultCard?.id ?? null;

  if (bookingQ.isLoading) {
    return (
      <Screen>
        <Skeleton height={56} style={{ marginTop: 12 }} />
        <Skeleton height={170} radius={28} style={{ marginTop: 16 }} />
        <Skeleton height={200} style={{ marginTop: 16 }} />
      </Screen>
    );
  }
  if (bookingQ.isError || !bookingQ.data) {
    return (
      <Screen>
        <Header title={t("payment.title")} />
        <ErrorState error={bookingQ.error} onRetry={() => bookingQ.refetch()} />
      </Screen>
    );
  }

  const detail = bookingQ.data;
  const b = detail.booking;
  const deposit = Number(b.deposit_amount);
  const payable = deposit > 0 && b.status === "pending";

  const finish = () => {
    void qc.invalidateQueries({ queryKey: qk.myBookings });
    void qc.invalidateQueries({ queryKey: qk.booking(id) });
    router.replace({ pathname: "/payment-success/[bookingId]", params: { bookingId: String(id) } });
  };

  const pay = async () => {
    if (!cardId) return;
    setPaying(true);
    try {
      const res = await paymentService.payDeposit(id, cardId);
      if (res.status === "paid") finish();
      else if (res.status === "pending_otp") setPayment({ id: res.payment_id, phone: res.phone_mask });
      else toast.error(t("common.errorGeneric"));
    } catch (e) {
      toast.error(errorMessage(e, t("common.errorGeneric")));
    } finally {
      setPaying(false);
    }
  };

  const confirm = async (value = code) => {
    if (!payment || value.length !== 6 || paying) return;
    setPaying(true);
    try {
      await paymentService.confirmPayment(payment.id, value);
      setPayment(null);
      finish();
    } catch (e) {
      setCode("");
      toast.error(errorMessage(e, t("common.errorGeneric")));
    } finally {
      setPaying(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        payable ? (
          <Button
            title={
              paying ? t("payment.paying") : t("payment.pay", { amount: formatMoney(deposit, b.currency) })
            }
            size="lg"
            loading={paying}
            disabled={!cardId}
            onPress={pay}
          />
        ) : (
          <Button title={t("payment.myTickets")} size="lg" onPress={() => router.replace("/vouchers")} />
        )
      }
    >
      <Header title={t("payment.title")} onBack={() => router.replace("/places")} />
      <PayHero amount={formatMoney(deposit, b.currency)} label={t("payment.depositAmount")} />

      {!payable ? (
        <Card style={{ marginTop: 16 }}>
          <Text variant="bodyMedium" color="success">
            {deposit > 0 ? t("payment.alreadyPaid") : t("payment.noDepositNeeded")}
          </Text>
        </Card>
      ) : (
        <View style={{ marginTop: 24, gap: 12 }}>
          <Text variant="h2">{t("payment.savedCards")}</Text>
          {cards.isLoading ? (
            <Skeleton height={68} />
          ) : cards.isError ? (
            <ErrorState error={cards.error} onRetry={() => cards.refetch()} />
          ) : (
            (cards.data ?? []).map((c) => (
              <CardTile key={c.id} card={c} selected={c.id === cardId} onPress={() => setCardId(c.id)} />
            ))
          )}
          <Button
            title={t("payment.addCard")}
            variant="outline"
            icon={<Plus size={18} color={colors.primary} />}
            onPress={() => setAddOpen(true)}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <ShieldCheck size={16} color={colors.success} />
            <Text variant="small" color="textMuted">
              {t("payment.secure")}
            </Text>
          </View>
        </View>
      )}

      <Card style={{ marginTop: 24 }}>
        <Text variant="h3" style={{ marginBottom: 8 }}>
          {t("booking.summaryTitle")}
        </Text>
        <KeyValue label={t("booking.venue")} value={detail.venue_name} />
        <KeyValue label={t("booking.date")} value={formatDate(b.booking_date)} />
        <KeyValue
          label={t("booking.time")}
          value={`${formatTime(b.start_time)} – ${formatTime(b.end_time)}`}
        />
        <KeyValue label={t("booking.guests")} value={t("common.guests", { count: b.guests_count })} />
        <View style={{ height: 8 }} />
        <PriceLines detail={detail} />
      </Card>

      <AddCardSheet visible={addOpen} onClose={() => setAddOpen(false)} onAdded={(c) => setCardId(c.id)} />

      <Sheet
        visible={!!payment}
        onClose={() => setPayment(null)}
        title={t("payment.paymentOtpTitle")}
        subtitle={payment?.phone ? t("payment.cardOtpSubtitle", { phone: payment.phone }) : undefined}
        footer={
          <Button
            title={t("common.confirm")}
            size="lg"
            loading={paying}
            disabled={code.length !== 6}
            onPress={() => confirm()}
          />
        }
      >
        <View style={{ gap: 16, paddingVertical: 8 }}>
          <OTPInput value={code} onChange={setCode} onComplete={(v) => confirm(v)} />
          {MOCK_PAYMENTS ? (
            <Text variant="small" color="info" align="center">
              {t("auth.otpMockHint", { code: "111111" })}
            </Text>
          ) : null}
        </View>
      </Sheet>
    </Screen>
  );
}
