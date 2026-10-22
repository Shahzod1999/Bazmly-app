import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react-native";
import { Button, EmptyState, IconButton, Segmented, Skeleton, toast } from "../components/ui";
import { useTheme } from "../theme/ThemeProvider";
import { QrScanner } from "../features/scan/QrScanner";
import { useBooking, useMyBookings } from "../api/queries";
import { ACTIVE_STATUSES } from "../features/tickets/status";
import { TicketCard } from "../features/tickets/TicketCard";
import { useMaxBrightness } from "../features/tickets/useMaxBrightness";
import { internalPathFromUrl } from "../lib/linking";
import { useIsAuthed } from "../stores/auth";
import { GuestGate } from "../features/auth/GuestGate";
import { toDateOnly } from "../lib/format";

/** Web `bottom-nav.tsx` skaneri: ruxsat → skanerlash → "Mening QR kodim" */
export default function ScanScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"scan" | "my_qr">("scan");

  const onScanned = (data: string) => {
    const path = internalPathFromUrl(data);
    if (!path) {
      toast.error(t("scan.unknownCode"));
      return;
    }
    router.replace(path as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: mode === "scan" ? "#000" : colors.background }}>
      {mode === "scan" ? <QrScanner onScanned={onScanned} /> : <MyQr />}
      <View style={[styles.top, { top: insets.top + 8 }]}>
        <Segmented
          options={[
            { value: "scan", label: t("scan.scanTab") },
            { value: "my_qr", label: t("scan.myQr") },
          ]}
          value={mode}
          onChange={setMode}
          style={{ flex: 1 }}
        />
        <IconButton
          icon={<X size={22} color={colors.text} />}
          accessibilityLabel={t("common.close")}
          onPress={() => router.back()}
        />
      </View>
    </View>
  );
}

function MyQr() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authed = useIsAuthed();
  const list = useMyBookings();
  const today = toDateOnly(new Date());
  const next = (list.data ?? [])
    .filter((b) => ACTIVE_STATUSES.includes(b.status) && b.booking_date >= today)
    .sort((a, b) => a.booking_date.localeCompare(b.booking_date))[0];
  const detail = useBooking(next?.id ?? 0);
  useMaxBrightness(!!detail.data);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 80, paddingHorizontal: 20 }}>
      {!authed ? (
        <GuestGate redirect="/vouchers" />
      ) : list.isLoading || (next && detail.isLoading) ? (
        <Skeleton height={480} radius={28} />
      ) : !next || !detail.data ? (
        <EmptyState
          title={t("scan.noActiveTicket")}
          description={t("tickets.emptyHint")}
          actionLabel={t("places.explore")}
          onAction={() => router.replace("/")}
        />
      ) : (
        <View style={{ gap: 12 }}>
          <TicketCard detail={detail.data} compact />
          <Button
            title={t("tickets.tabTickets")}
            variant="secondary"
            onPress={() => router.replace("/vouchers")}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 10 },
});
