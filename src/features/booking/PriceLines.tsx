import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Divider, KeyValue } from "../../components/ui";
import type { BookingOwnerDetail } from "../../api";
import { formatMoney } from "../../lib/format";

/** Backend hisoblagan narx qatorlari (ilova o'zi hisoblamaydi) */
export function PriceLines({ detail }: { detail: BookingOwnerDetail }) {
  const { t } = useTranslation();
  const b = detail.booking;
  const lines = [...(detail.price_lines ?? [])]
    .sort((a, b2) => a.sort_order - b2.sort_order)
    .filter((l) => l.line_type !== "deposit");
  return (
    <View>
      {lines.map((l) => (
        <KeyValue
          key={l.id}
          label={l.quantity > 1 ? `${l.label_snapshot} × ${l.quantity}` : l.label_snapshot}
          value={formatMoney(l.amount, b.currency)}
        />
      ))}
      {lines.length ? <Divider style={{ marginVertical: 8 }} /> : null}
      <KeyValue label={t("payment.total")} value={formatMoney(b.total_amount, b.currency)} strong />
      {Number(b.deposit_amount) > 0 ? (
        <KeyValue
          label={t("payment.depositAmount")}
          value={formatMoney(b.deposit_amount, b.currency)}
          strong
        />
      ) : null}
    </View>
  );
}
