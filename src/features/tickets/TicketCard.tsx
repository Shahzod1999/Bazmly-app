import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { useTranslation } from "react-i18next";
import { Copy } from "lucide-react-native";
import { Badge, Text, toast } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import type { BookingOwnerDetail } from "../../api";
import { useBookingVenueName } from "./useBookingVenueName";
import { formatDate, formatMoney, formatTime } from "../../lib/format";
import { statusTone } from "./status";

/** "Rasmiy chipta" — QR kod bilan (kirishda ko'rsatiladi) */
export function TicketCard({ detail, compact }: { detail: BookingOwnerDetail; compact?: boolean }) {
  const venueName = useBookingVenueName(detail);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const b = detail.booking;

  const copy = async () => {
    await Clipboard.setStringAsync(b.ticket_code);
    toast.success(t("common.copied"));
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.top}>
        <View style={styles.rowBetween}>
          <Text variant="caption" color="primary">
            {t("tickets.official").toUpperCase()}
          </Text>
          <Text variant="caption" color="textMuted">
            #{b.receipt_number}
          </Text>
        </View>
        <Text variant="h1" style={{ marginTop: 8 }}>
          {venueName}
        </Text>
        <Badge label={t(`status.${b.status}`)} tone={statusTone(b.status)} style={{ marginTop: 8 }} />
        <View style={styles.grid}>
          <Field label={t("booking.date")} value={formatDate(b.booking_date)} />
          <Field
            label={t("booking.time")}
            value={`${formatTime(b.start_time)} – ${formatTime(b.end_time)}`}
          />
          <Field label={t("booking.guests")} value={t("common.guests", { count: b.guests_count })} />
          <Field
            label={t("payment.total")}
            // Stol broni ko'pincha narxsiz (buyurtma joyida) — "0 so'm" o'rniga tushunarli matn
            value={Number(b.total_amount) > 0 ? formatMoney(b.total_amount, b.currency) : t("tickets.payAtVenue")}
            accent
          />
        </View>
      </View>

      <View style={styles.cut}>
        <View
          style={[
            styles.notch,
            { left: -12, backgroundColor: colors.background, borderColor: colors.border },
          ]}
        />
        <View style={[styles.dash, { borderColor: colors.border }]} />
        <View
          style={[
            styles.notch,
            { right: -12, backgroundColor: colors.background, borderColor: colors.border },
          ]}
        />
      </View>

      <View style={styles.qrWrap}>
        <View style={styles.qrBox}>
          <QRCode
            value={detail.qr_token || b.ticket_code}
            size={compact ? 150 : 200}
            backgroundColor="#fff"
            color="#111"
          />
        </View>
        <Text variant="caption" color="textMuted" style={{ marginTop: 12 }}>
          {t("tickets.entryCode").toUpperCase()}
        </Text>
        <Pressable
          onPress={copy}
          style={styles.codeRow}
          accessibilityRole="button"
          accessibilityLabel={t("common.copy")}
        >
          <Text variant="h2" tabular style={{ letterSpacing: 2 }}>
            {b.ticket_code}
          </Text>
          <Copy size={18} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ width: "50%", paddingVertical: 8 }}>
      <Text variant="caption" color="textMuted">
        {label.toUpperCase()}
      </Text>
      <Text variant="smallMedium" color={accent ? "primary" : "text"} style={{ marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xxl, borderWidth: 1, overflow: "visible" },
  top: { padding: 20 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  cut: { height: 24, justifyContent: "center" },
  dash: { borderTopWidth: 2, borderStyle: "dashed", marginHorizontal: 18 },
  notch: { position: "absolute", width: 24, height: 24, borderRadius: 12, borderWidth: 1 },
  qrWrap: { alignItems: "center", padding: 20, paddingTop: 8 },
  qrBox: { padding: 14, backgroundColor: "#fff", borderRadius: radius.lg },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4, padding: 6 },
});
