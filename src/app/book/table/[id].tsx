import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react-native";
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  Screen,
  Skeleton,
  Stepper,
  Text,
  errorMessage,
  toast,
} from "../../../components/ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { radius } from "../../../theme/tokens";
import { useBookTable, useFreeTables, useVenue, useZones } from "../../../api/queries";
import { useDraft, addMinutes, timeSlots, toApiTime } from "../../../features/booking/useDraft";
import { WizardHeader } from "../../../features/booking/StepHeader";
import { ContactStep } from "../../../features/booking/ContactStep";
import { goAfterBookingCreated } from "../../../features/booking/afterCreate";
import {
  formatDate,
  formatTime,
  mondayBasedWeekday,
  toDateOnly,
  toE164,
  weekdayShort,
} from "../../../lib/format";
import { haptic } from "../../../lib/haptics";

const TOTAL = 3;
const DURATIONS = [60, 90, 120, 180];

export default function TableBookingScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Number(idParam);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const venueQ = useVenue(id);
  const zones = useZones(id);
  const { draft, update, clear } = useDraft(id, "table");
  const book = useBookTable();
  const [showErrors, setShowErrors] = useState(false);
  const [duration, setDuration] = useState(() => {
    const [sh, sm] = draft.startTime.split(":").map(Number);
    const [eh, em] = draft.endTime.split(":").map(Number);
    return Math.max(60, eh * 60 + em - (sh * 60 + sm)) || 120;
  });

  const v = venueQ.data?.venue;
  const hours = venueQ.data?.working_hours ?? [];
  const days = useMemo(() => {
    const out: Date[] = [];
    const start = new Date();
    start.setDate(start.getDate() + Math.max(0, v?.min_advance_booking_days ?? 0));
    for (let i = 0; i < 21; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(d);
    }
    return out;
  }, [v?.min_advance_booking_days]);

  const selectedDay = draft.date ?? toDateOnly(days[0] ?? new Date());
  const dayHours = hours.find((h) => h.weekday === mondayBasedWeekday(new Date(selectedDay + "T12:00:00")));
  const closedDay = dayHours?.is_closed ?? false;
  const slots = useMemo(() => {
    const open = formatTime(dayHours?.opens_at) !== "—" ? formatTime(dayHours?.opens_at) : "10:00";
    let close = formatTime(dayHours?.closes_at) !== "—" ? formatTime(dayHours?.closes_at) : "22:00";
    if (close <= open) close = "23:30"; // tun yarmidan keyin yopiladigan joylar
    const last = addMinutes(close, -60);
    let list = timeSlots(open, last < open ? open : last, 30);
    if (selectedDay === toDateOnly(new Date())) {
      const now = new Date();
      const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      list = list.filter((s) => s > cur);
    }
    return list;
  }, [dayHours, selectedDay]);

  const endTime = addMinutes(draft.startTime, duration);
  const freeTables = useFreeTables(
    id,
    draft.step >= 1 ? selectedDay : null,
    toApiTime(draft.startTime),
    toApiTime(endTime),
    draft.guests,
  );
  const tables = (freeTables.data ?? []).filter((tb) => !draft.zoneId || tb.zone_id === draft.zoneId);
  const selectedTable = (freeTables.data ?? []).find((tb) => tb.id === draft.tableId);

  if (venueQ.isLoading) {
    return (
      <Screen>
        <Skeleton height={60} style={{ marginTop: 12 }} />
        <Skeleton height={300} style={{ marginTop: 20 }} />
      </Screen>
    );
  }
  if (venueQ.isError || !v)
    return (
      <Screen>
        <ErrorState error={venueQ.error} onRetry={() => venueQ.refetch()} />
      </Screen>
    );

  const step = draft.step;
  const canNext =
    (step === 0 && !closedDay && slots.includes(draft.startTime)) || (step === 1 && !!selectedTable);
  const back = () => (step === 0 ? router.back() : update({ step: step - 1 }));

  const submit = async () => {
    setShowErrors(true);
    if (!draft.contactName.trim() || draft.contactPhone.length !== 9 || !draft.tableId) return;
    try {
      const detail = await book.mutateAsync({
        venue_id: id,
        booking_date: selectedDay,
        start_time: toApiTime(draft.startTime),
        end_time: toApiTime(endTime),
        guests_count: draft.guests,
        contact_name: draft.contactName.trim(),
        contact_phone: toE164(draft.contactPhone),
        table_id: draft.tableId,
        note: draft.note.trim() || undefined,
      });
      clear();
      goAfterBookingCreated(detail);
    } catch (e) {
      toast.error(errorMessage(e, t("common.errorGeneric")));
      // Stol band bo'lib qolgan bo'lishi mumkin — ro'yxatni yangilaymiz
      void freeTables.refetch();
    }
  };

  return (
    <Screen
      scroll
      keyboard
      footer={
        step < TOTAL - 1 ? (
          <Button
            title={t("common.next")}
            size="lg"
            disabled={!canNext}
            onPress={() => update({ step: step + 1, date: selectedDay, endTime })}
          />
        ) : (
          <Button title={t("booking.submit")} size="lg" loading={book.isPending} onPress={submit} />
        )
      }
    >
      <WizardHeader
        title={v.name}
        subtitle={t("booking.step", { current: step + 1, total: TOTAL })}
        step={step}
        total={TOTAL}
        onBack={back}
      />

      {step === 0 ? (
        <View style={{ gap: 24 }}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text variant="h2">{t("booking.guestsTitle")}</Text>
              <Text variant="small" color="textMuted">
                {t("booking.guestsHint")}
              </Text>
            </View>
            <Stepper
              value={draft.guests}
              onChange={(g) => update({ guests: g, tableId: null })}
              min={1}
              max={v.total_seats ?? 50}
            />
          </View>

          <View>
            <Text variant="h2" style={{ marginBottom: 12 }}>
              {t("booking.dateTitle")}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {days.map((d) => {
                const k = toDateOnly(d);
                const active = k === selectedDay;
                return (
                  <Pressable
                    key={k}
                    onPress={() => {
                      haptic.selection();
                      update({ date: k, tableId: null });
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.day,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text variant="caption" color={active ? colors.onPrimary : colors.textMuted}>
                      {weekdayShort(mondayBasedWeekday(d)).toUpperCase()}
                    </Text>
                    <Text variant="h2" color={active ? colors.onPrimary : colors.text}>
                      {d.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View>
            <Text variant="h2" style={{ marginBottom: 12 }}>
              {t("booking.timeTitle")}
            </Text>
            {closedDay || slots.length === 0 ? (
              <Text variant="body" color="danger">
                {closedDay ? t("venue.closedDay") : t("booking.tablesEmpty")}
              </Text>
            ) : (
              <View style={styles.wrap}>
                {slots.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    selected={draft.startTime === s}
                    onPress={() => update({ startTime: s, tableId: null })}
                  />
                ))}
              </View>
            )}
          </View>

          <View>
            <Text variant="h3" style={{ marginBottom: 10 }}>
              {t("booking.endTime")}: {endTime}
            </Text>
            <View style={styles.wrap}>
              {DURATIONS.map((m) => (
                <Chip
                  key={m}
                  label={m < 60 ? `${m}m` : `${m / 60}h`}
                  selected={duration === m}
                  onPress={() => setDuration(m)}
                />
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View>
          <Text variant="h1">{t("booking.tableTitle")}</Text>
          <Text variant="small" color="textMuted" style={{ marginTop: 4 }}>
            {formatDate(selectedDay, false)} · {draft.startTime} – {endTime} ·{" "}
            {t("common.guests", { count: draft.guests })}
          </Text>
          {(zones.data ?? []).length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 16 }}
            >
              <Chip
                label={t("booking.zoneAll")}
                selected={!draft.zoneId}
                onPress={() => update({ zoneId: null })}
              />
              {(zones.data ?? []).map((z) => (
                <Chip
                  key={z.id}
                  label={z.name}
                  selected={draft.zoneId === z.id}
                  onPress={() => update({ zoneId: z.id })}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={{ height: 16 }} />
          )}
          {freeTables.isLoading ? (
            <View style={styles.wrap}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} width={96} height={96} radius={16} />
              ))}
            </View>
          ) : freeTables.isError ? (
            <ErrorState error={freeTables.error} onRetry={() => freeTables.refetch()} />
          ) : tables.length === 0 ? (
            <EmptyState title={t("booking.tablesEmpty")} />
          ) : (
            <View style={styles.wrap}>
              {tables.map((tb) => {
                const active = tb.id === draft.tableId;
                return (
                  <Pressable
                    key={tb.id}
                    onPress={() => {
                      haptic.selection();
                      update({ tableId: tb.id });
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={t("booking.table", { number: tb.number })}
                    style={[
                      styles.table,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {active ? (
                      <Check size={16} color="#fff" style={{ position: "absolute", top: 8, right: 8 }} />
                    ) : null}
                    <Text variant="caption" color={active ? colors.onPrimary : colors.textMuted}>
                      {t("booking.table", { number: "" }).trim().toUpperCase()}
                    </Text>
                    <Text variant="display" color={active ? colors.onPrimary : colors.text}>
                      {tb.number}
                    </Text>
                    <Text variant="caption" color={active ? colors.onPrimary : colors.textMuted}>
                      {t("booking.tableSeats", { count: tb.seats })}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      ) : null}

      {step === 2 ? (
        <ContactStep
          draft={draft}
          update={update}
          showErrors={showErrors}
          summary={[
            { label: t("booking.venue"), value: v.name },
            { label: t("booking.date"), value: formatDate(selectedDay) },
            { label: t("booking.time"), value: `${draft.startTime} – ${endTime}` },
            { label: t("booking.guests"), value: t("common.guests", { count: draft.guests }) },
            ...(selectedTable
              ? [
                  {
                    label: t("booking.tableTitle"),
                    value: t("booking.table", { number: selectedTable.number }),
                  },
                ]
              : []),
          ]}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", alignItems: "center", gap: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  day: {
    width: 64,
    height: 76,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  table: {
    width: 96,
    height: 104,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
