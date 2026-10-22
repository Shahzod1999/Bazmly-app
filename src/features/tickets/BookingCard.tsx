import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { CalendarDays, Clock, Users } from "lucide-react-native";
import { Badge, Card, Divider, Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import type { BookingListItem } from "../../api";
import { formatDate, formatMoney, formatTime } from "../../lib/format";
import { venueImage } from "../venues/images";
import { statusTone } from "./status";

export function BookingCard({
  booking,
  onPress,
  footer,
}: {
  booking: BookingListItem;
  onPress?: () => void;
  footer?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const b = booking;
  return (
    <Card onPress={onPress} accessibilityLabel={b.venue_name}>
      <View style={styles.row}>
        <Image
          source={venueImage(b.venue_id, null, b.kind === "hall" ? "toyxona" : "restoran")}
          style={styles.img}
          contentFit="cover"
        />
        <View style={{ flex: 1, gap: 5 }}>
          <Text variant="h3" numberOfLines={1}>
            {b.venue_name}
          </Text>
          <View style={styles.meta}>
            <CalendarDays size={14} color={colors.textMuted} />
            <Text variant="small" color="textMuted">
              {formatDate(b.booking_date)}
            </Text>
            <Clock size={14} color={colors.textMuted} style={{ marginLeft: 6 }} />
            <Text variant="small" color="textMuted" tabular>
              {formatTime(b.start_time)}
            </Text>
          </View>
          <View style={styles.meta}>
            <Users size={14} color={colors.textMuted} />
            <Text variant="small" color="textMuted">
              {t("common.guests", { count: b.guests_count })} ·{" "}
              {b.table_number ? t("places.table", { number: b.table_number }) : t("places.hall")}
            </Text>
          </View>
        </View>
      </View>
      <Divider style={{ marginVertical: 12 }} />
      <View style={styles.rowBetween}>
        <Text variant="small" color="textMuted">
          {t("places.status")}
        </Text>
        <Badge label={t(`status.${b.status}`)} tone={statusTone(b.status)} />
      </View>
      <View style={[styles.rowBetween, { marginTop: 8 }]}>
        <Text variant="small" color="textMuted">
          {t("places.total")}
        </Text>
        <Text variant="h3" color="primary" tabular>
          {formatMoney(b.total_amount, b.currency)}
        </Text>
      </View>
      {footer ? <View style={{ marginTop: 12 }}>{footer}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  img: { width: 72, height: 72, borderRadius: radius.md },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
