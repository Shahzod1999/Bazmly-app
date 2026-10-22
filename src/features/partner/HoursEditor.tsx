import React, { useState } from "react";
import { Switch, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button, Input, Sheet, Text, errorMessage, toast } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useUpdateWorkingHours, useVenue } from "../../api/queries";
import type { WorkingHoursCreate } from "../../api";
import { formatTime, weekdayLong } from "../../lib/format";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function HoursEditor({
  venueId,
  visible,
  onClose,
}: {
  venueId: number;
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const detail = useVenue(venueId);
  const save = useUpdateWorkingHours(venueId);
  const [days, setDays] = useState<WorkingHoursCreate[]>([]);

  // Ochilganda (yoki ma'lumot kelganda) backend'dagi soatlardan boshlanadi
  const [syncedWith, setSyncedWith] = useState<{ visible: boolean; data: unknown }>({
    visible: false,
    data: undefined,
  });
  if (syncedWith.visible !== visible || (visible && syncedWith.data !== detail.data)) {
    setSyncedWith({ visible, data: detail.data });
    if (visible) {
      const existing = detail.data?.working_hours ?? [];
      setDays(
        Array.from({ length: 7 }, (_, i) => {
          const h = existing.find((x) => x.weekday === i);
          return {
            weekday: i,
            opens_at: h?.opens_at ? formatTime(h.opens_at) : "10:00",
            closes_at: h?.closes_at ? formatTime(h.closes_at) : "23:00",
            is_closed: h?.is_closed ?? false,
          };
        }),
      );
    }
  }

  const valid = days.every(
    (d) => d.is_closed || (TIME_RE.test(d.opens_at ?? "") && TIME_RE.test(d.closes_at ?? "")),
  );
  const patch = (i: number, p: Partial<WorkingHoursCreate>) =>
    setDays((all) => all.map((d) => (d.weekday === i ? { ...d, ...p } : d)));

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t("partner.editHours")}
      scrollable
      footer={
        <Button
          title={t("common.save")}
          loading={save.isPending}
          disabled={!valid}
          onPress={() =>
            save.mutate(
              days.map((d) => ({
                ...d,
                opens_at: d.is_closed ? null : `${d.opens_at}:00`,
                closes_at: d.is_closed ? null : `${d.closes_at}:00`,
              })),
              {
                onSuccess: () => {
                  toast.success(t("profile.saved"));
                  onClose();
                },
                onError: (e) => toast.error(errorMessage(e, t("common.errorGeneric"))),
              },
            )
          }
        />
      }
    >
      <View style={{ gap: 14 }}>
        {days.map((d) => (
          <View key={d.weekday} style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text variant="bodyMedium" style={{ flex: 1 }}>
                {weekdayLong(d.weekday)}
              </Text>
              <Text variant="small" color="textMuted" style={{ marginRight: 8 }}>
                {t("partner.dayOff")}
              </Text>
              <Switch
                value={!!d.is_closed}
                onValueChange={(v) => patch(d.weekday, { is_closed: v })}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
            </View>
            {!d.is_closed ? (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Input
                  containerStyle={{ flex: 1 }}
                  label={t("partner.opens")}
                  value={d.opens_at ?? ""}
                  onChangeText={(v) => patch(d.weekday, { opens_at: v.slice(0, 5) })}
                  placeholder="10:00"
                  keyboardType="numbers-and-punctuation"
                  error={d.opens_at && !TIME_RE.test(d.opens_at) ? "HH:MM" : null}
                />
                <Input
                  containerStyle={{ flex: 1 }}
                  label={t("partner.closes")}
                  value={d.closes_at ?? ""}
                  onChangeText={(v) => patch(d.weekday, { closes_at: v.slice(0, 5) })}
                  placeholder="23:00"
                  keyboardType="numbers-and-punctuation"
                  error={d.closes_at && !TIME_RE.test(d.closes_at) ? "HH:MM" : null}
                />
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </Sheet>
  );
}
