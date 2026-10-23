import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react-native";
import { Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { formatMoney } from "../../lib/format";
import type { BookingRead } from "../../api";

/**
 * Depozit ilovada to'lanmaydi: backend'da onlayn to'lov yo'q (DECISIONS.md Part 10),
 * miqdorni backend hisoblaydi va to'lov muassasa bilan kelishiladi.
 */
export function DepositNotice({ booking }: { booking: Pick<BookingRead, "deposit_amount" | "currency"> }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  if (!(Number(booking.deposit_amount) > 0)) return null;
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        padding: 14,
        borderRadius: radius.lg,
        backgroundColor: colors.infoSoft,
      }}
    >
      <Info size={20} color={colors.info} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="smallMedium">
          {t("booking.depositAmountLine", { amount: formatMoney(booking.deposit_amount, booking.currency) })}
        </Text>
        <Text variant="small" color="textMuted">
          {t("booking.depositOffline")}
        </Text>
      </View>
    </View>
  );
}
