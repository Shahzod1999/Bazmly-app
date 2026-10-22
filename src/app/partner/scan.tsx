import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Keyboard, X, XCircle } from "lucide-react-native";
import { Button, IconButton, Input, Sheet, Text, errorMessage } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { QrScanner } from "../../features/scan/QrScanner";
import { useCheckIn } from "../../api/queries";
import { usePartnerContext } from "../../features/partner/usePartnerContext";
import type { BookingRead } from "../../api";
import { formatTime } from "../../lib/format";
import { haptic } from "../../lib/haptics";

/** Hamkor: mijoz chiptasidagi QR → POST /venue/bookings/check-in */
export default function PartnerScan() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ctx = usePartnerContext();
  const checkIn = useCheckIn();
  const [result, setResult] = useState<
    { ok: true; booking: BookingRead } | { ok: false; message: string } | null
  >(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState("");

  const run = (token: string) => {
    if (!ctx.venueId || checkIn.isPending) return;
    checkIn.mutate(
      { qrToken: token.trim(), venueId: ctx.venueId },
      {
        onSuccess: (booking) => {
          haptic.success();
          setResult({ ok: true, booking });
        },
        onError: (e) => {
          haptic.error();
          setResult({ ok: false, message: errorMessage(e, t("partner.checkInFail")) });
        },
      },
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <QrScanner
        onScanned={run}
        paused={!!result || checkIn.isPending || manualOpen}
        hint={t("partner.scanHint")}
      />
      <View style={[styles.top, { top: insets.top + 8 }]}>
        <View style={[styles.title, { backgroundColor: colors.card }]}>
          <Text variant="h3">{t("partner.scanTitle")}</Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {ctx.venue?.name}
          </Text>
        </View>
        <IconButton
          icon={<X size={22} color={colors.text} />}
          accessibilityLabel={t("common.close")}
          onPress={() => router.back()}
        />
      </View>
      <View style={[styles.bottom, { bottom: insets.bottom + 110 }]}>
        <Button
          title={t("partner.manualCode")}
          variant="secondary"
          icon={<Keyboard size={18} color={colors.text} />}
          fullWidth={false}
          onPress={() => setManualOpen(true)}
        />
      </View>

      <Sheet
        visible={manualOpen}
        onClose={() => setManualOpen(false)}
        title={t("partner.manualCode")}
        footer={
          <Button
            title={t("partner.checkIn")}
            disabled={!manual.trim()}
            loading={checkIn.isPending}
            onPress={() => {
              setManualOpen(false);
              run(manual);
              setManual("");
            }}
          />
        }
      >
        <Input
          placeholder={t("partner.manualPlaceholder")}
          value={manual}
          onChangeText={setManual}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      </Sheet>

      <Sheet visible={!!result} onClose={() => setResult(null)}>
        {result ? (
          <View style={{ alignItems: "center", paddingVertical: 12, gap: 8 }}>
            {result.ok ? (
              <CheckCircle2 size={64} color={colors.success} />
            ) : (
              <XCircle size={64} color={colors.danger} />
            )}
            <Text variant="h1" align="center">
              {result.ok ? t("partner.checkInSuccess") : t("partner.checkInFail")}
            </Text>
            {result.ok ? (
              <View style={{ alignItems: "center", gap: 4 }}>
                <Text variant="h3">{result.booking.contact_name}</Text>
                <Text variant="body" color="textMuted">
                  {t("common.guests", { count: result.booking.guests_count })} ·{" "}
                  {formatTime(result.booking.start_time)}–{formatTime(result.booking.end_time)}
                  {result.booking.table_id ? ` · #${result.booking.table_id}` : ""}
                </Text>
              </View>
            ) : (
              <Text variant="body" color="textMuted" align="center">
                {result.message}
              </Text>
            )}
            <Button
              title={t("partner.scanAgain")}
              onPress={() => setResult(null)}
              style={{ marginTop: 16, alignSelf: "stretch" }}
            />
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  title: { flex: 1, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  bottom: { position: "absolute", left: 0, right: 0, alignItems: "center" },
});
