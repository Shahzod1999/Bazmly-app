import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Divider, Input, KeyValue, PhoneInput, Text } from "../../components/ui";
import type { BookingDraft } from "../../stores/bookingDraft";

interface Props {
  draft: BookingDraft;
  update: (p: Partial<BookingDraft>) => void;
  summary: { label: string; value: string }[];
  showErrors: boolean;
}

export function ContactStep({ draft, update, summary, showErrors }: Props) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 16 }}>
      <Text variant="h1">{t("booking.contactTitle")}</Text>
      <Input
        label={t("booking.contactName")}
        value={draft.contactName}
        onChangeText={(v) => update({ contactName: v })}
        autoCapitalize="words"
        textContentType="name"
        error={showErrors && !draft.contactName.trim() ? t("errors.required") : null}
      />
      <PhoneInput
        label={t("booking.contactPhone")}
        value={draft.contactPhone}
        onChangeText={(v) => update({ contactPhone: v })}
        error={showErrors && draft.contactPhone.length !== 9 ? t("auth.phoneInvalid") : null}
      />
      <Input
        label={`${t("booking.note")} (${t("common.optional")})`}
        placeholder={t("booking.notePlaceholder")}
        value={draft.note}
        onChangeText={(v) => update({ note: v })}
        multiline
        maxLength={500}
      />
      <Card>
        <Text variant="h3" style={{ marginBottom: 8 }}>
          {t("booking.summaryTitle")}
        </Text>
        {summary.map((s) => (
          <KeyValue key={s.label} label={s.label} value={s.value} />
        ))}
        <Divider style={{ marginVertical: 10 }} />
        <Text variant="small" color="textMuted">
          {t("booking.priceNote")}
        </Text>
      </Card>
    </View>
  );
}
