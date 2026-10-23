import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ChefHat, Utensils } from "lucide-react-native";
import {
  Button,
  Card,
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
import { useAvailability, useBookHall, useVenue, useVenueServices } from "../../../api/queries";
import type { ServicePriceUnit } from "../../../api";
import { useDraft, toApiTime } from "../../../features/booking/useDraft";
import { Calendar } from "../../../features/booking/Calendar";
import { WizardHeader } from "../../../features/booking/StepHeader";
import { ContactStep } from "../../../features/booking/ContactStep";
import { goAfterBookingCreated } from "../../../features/booking/afterCreate";
import { OptionCard } from "../../../features/booking/OptionCard";
import { formatDate, formatMoney, toDateOnly, toE164 } from "../../../lib/format";

const TOTAL = 4;
const SLOTS = [
  { key: "day", start: "12:00", end: "16:00" },
  { key: "evening", start: "18:00", end: "23:00" },
];

export default function HallBookingScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Number(idParam);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const venueQ = useVenue(id);
  const v = venueQ.data?.venue;
  const services = useVenueServices(id, v?.venue_group_id);
  const { draft, update, clear } = useDraft(id, "hall");
  const book = useBookHall();
  const [showErrors, setShowErrors] = useState(false);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + Math.max(0, v?.min_advance_booking_days ?? 1));
    return d;
  }, [v?.min_advance_booking_days]);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d;
  }, []);
  const [rangeStart, setRangeStart] = useState(() => new Date(minDate.getFullYear(), minDate.getMonth(), 1));
  const rangeEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + 2, 0);
  const availability = useAvailability(id, toDateOnly(rangeStart), toDateOnly(rangeEnd));
  const blocked = useMemo(() => new Set(availability.data?.dates ?? []), [availability.data]);

  if (venueQ.isLoading) {
    return (
      <Screen>
        <Skeleton height={60} style={{ marginTop: 12 }} />
        <Skeleton height={360} style={{ marginTop: 20 }} />
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
  const capMin = v.capacity_min ?? 1;
  const capMax = v.capacity_max ?? 3000;
  // Narx bosqichlari: backend mehmonlar soniga mos bosqichni o'zi tanlaydi va mos bosqich
  // bo'lmasa bronni rad etadi (capacity_exceeded) — shuning uchun tanlov shu oraliqlarda cheklanadi
  const tiers = [...(venueQ.data?.guest_tiers ?? [])].sort((a, b) => a.min_guests - b.min_guests);
  const tierFor = (g: number) =>
    tiers.find((tr) => g >= tr.min_guests && (tr.max_guests == null || g <= tr.max_guests)) ?? null;
  const currentTier = tierFor(draft.guests);
  const guestsMin = tiers.length ? tiers[0].min_guests : 1;
  const lastTier = tiers[tiers.length - 1];
  const guestsMax = tiers.length ? (lastTier.max_guests ?? capMax) : capMax;

  const unitLabel = (u: ServicePriceUnit) =>
    ({
      per_guest: t("booking.perGuest"),
      per_hour: t("booking.perHour"),
      flat: t("booking.fixed"),
    })[u];

  const canNext =
    (step === 0 && !!draft.date && !blocked.has(draft.date)) ||
    (step === 1 && draft.guests >= 1 && !!currentTier && draft.startTime < draft.endTime) ||
    (step === 2 && !!draft.serviceMode) ||
    step === 3;

  const back = () => (step === 0 ? router.back() : update({ step: step - 1 }));

  const submit = async () => {
    setShowErrors(true);
    if (!draft.contactName.trim() || draft.contactPhone.length !== 9 || !draft.date) return;
    const modeNote = draft.serviceMode === "ready" ? t("booking.serviceReady") : t("booking.serviceOwn");
    try {
      const detail = await book.mutateAsync({
        venue_id: id,
        booking_date: draft.date,
        start_time: toApiTime(draft.startTime),
        end_time: toApiTime(draft.endTime),
        guests_count: draft.guests,
        contact_name: draft.contactName.trim(),
        contact_phone: toE164(draft.contactPhone),
        // Xizmat turi uchun backend'da alohida maydon yo'q — izohga yoziladi (BACKEND_CONTRACT §6)
        note: [`${t("booking.service")}: ${modeNote}`, draft.note.trim()].filter(Boolean).join("\n"),
        venue_service_ids: draft.serviceIds.length ? draft.serviceIds : undefined,
      });
      clear();
      goAfterBookingCreated(detail);
    } catch (e) {
      toast.error(errorMessage(e, t("common.errorGeneric")));
    }
  };

  const selectedServices = (services.data ?? []).filter((s) => draft.serviceIds.includes(s.id));

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
            onPress={() => update({ step: step + 1 })}
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
        <View>
          <Text variant="h1">{t("booking.dateTitle")}</Text>
          <Text variant="small" color="textMuted" style={{ marginTop: 4, marginBottom: 16 }}>
            {t("booking.dateHint")}
          </Text>
          <Card>
            <Calendar
              value={draft.date}
              onChange={(date) => update({ date })}
              blocked={blocked}
              minDate={minDate}
              maxDate={maxDate}
              onMonthChange={(m) => setRangeStart(m)}
            />
          </Card>
          {availability.isError ? (
            <Text variant="small" color="danger" style={{ marginTop: 8 }}>
              {errorMessage(availability.error, t("common.errorGeneric"))}
            </Text>
          ) : null}
        </View>
      ) : null}

      {step === 1 ? (
        <View style={{ gap: 24 }}>
          <View>
            <Text variant="h1">{t("booking.guestsTitle")}</Text>
            <Text variant="small" color="textMuted" style={{ marginTop: 4, marginBottom: 14 }}>
              {tiers.length
                ? lastTier.max_guests != null
                  ? t("venue.capacityRange", { min: guestsMin, max: guestsMax })
                  : t("booking.tierFrom", { min: guestsMin })
                : v.capacity_min && v.capacity_max
                  ? t("venue.capacityRange", { min: capMin, max: capMax })
                  : t("booking.guestsHint")}
            </Text>
            <Stepper
              value={draft.guests}
              onChange={(g) => update({ guests: g })}
              min={guestsMin}
              max={guestsMax}
              step={draft.guests >= 100 ? 10 : 5}
            />
            {tiers.length ? (
              <View style={{ gap: 8, marginTop: 16 }}>
                <Text variant="smallMedium" color="textMuted">
                  {t("booking.tiersTitle")}
                </Text>
                {tiers.map((tr) => (
                  <OptionCard
                    key={tr.id}
                    active={currentTier?.id === tr.id}
                    title={
                      tr.max_guests != null
                        ? t("venue.capacityRange", { min: tr.min_guests, max: tr.max_guests })
                        : t("booking.tierFrom", { min: tr.min_guests })
                    }
                    subtitle={formatMoney(tr.base_price, v.currency)}
                    onPress={() => {
                      if (currentTier?.id !== tr.id) update({ guests: tr.min_guests });
                    }}
                  />
                ))}
                {!currentTier ? (
                  <Text variant="small" color="danger">
                    {t("booking.tierNone")}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text variant="small" color="danger" style={{ marginTop: 12 }}>
                {t("booking.tiersMissing")}
              </Text>
            )}
          </View>
          <View>
            <Text variant="h1" style={{ marginBottom: 14 }}>
              {t("booking.timeTitle")}
            </Text>
            <View style={{ gap: 10 }}>
              {SLOTS.map((s) => {
                const active = draft.startTime === s.start && draft.endTime === s.end;
                return (
                  <OptionCard
                    key={s.key}
                    active={active}
                    title={`${s.start} – ${s.end}`}
                    onPress={() => update({ startTime: s.start, endTime: s.end })}
                  />
                );
              })}
            </View>
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ gap: 12 }}>
          <Text variant="h1">{t("booking.serviceTitle")}</Text>
          <OptionCard
            active={draft.serviceMode === "ready"}
            icon={<ChefHat size={22} color={colors.primary} />}
            title={t("booking.serviceReady")}
            subtitle={t("booking.serviceReadyHint")}
            onPress={() => update({ serviceMode: "ready" })}
          />
          <OptionCard
            active={draft.serviceMode === "own"}
            icon={<Utensils size={22} color={colors.primary} />}
            title={t("booking.serviceOwn")}
            subtitle={t("booking.serviceOwnHint")}
            onPress={() => update({ serviceMode: "own" })}
          />

          <Text variant="h2" style={{ marginTop: 16 }}>
            {t("booking.extrasTitle")}
          </Text>
          {services.isLoading ? (
            <Skeleton height={64} />
          ) : services.isError ? (
            <ErrorState error={services.error} onRetry={() => services.refetch()} />
          ) : !(services.data ?? []).filter((s) => s.is_active).length ? (
            <EmptyState title={t("booking.extrasEmpty")} style={{ paddingVertical: 16 }} />
          ) : (
            (services.data ?? [])
              .filter((s) => s.is_active)
              .map((s) => {
                const on = draft.serviceIds.includes(s.id);
                return (
                  <OptionCard
                    key={s.id}
                    active={on}
                    checkbox
                    title={s.name}
                    subtitle={`${formatMoney(s.price, s.currency)} · ${unitLabel(s.price_unit)}`}
                    onPress={() =>
                      update({
                        serviceIds: on
                          ? draft.serviceIds.filter((x) => x !== s.id)
                          : [...draft.serviceIds, s.id],
                      })
                    }
                  />
                );
              })
          )}
        </View>
      ) : null}

      {step === 3 ? (
        <ContactStep
          draft={draft}
          update={update}
          showErrors={showErrors}
          summary={[
            { label: t("booking.venue"), value: v.name },
            { label: t("booking.date"), value: formatDate(draft.date) },
            { label: t("booking.time"), value: `${draft.startTime} – ${draft.endTime}` },
            { label: t("booking.guests"), value: t("common.guests", { count: draft.guests }) },
            {
              label: t("booking.service"),
              value: draft.serviceMode === "ready" ? t("booking.serviceReady") : t("booking.serviceOwn"),
            },
            ...(selectedServices.length
              ? [{ label: t("booking.extrasTitle"), value: selectedServices.map((s) => s.name).join(", ") }]
              : []),
            ...(currentTier
              ? [{ label: t("booking.hallRental"), value: formatMoney(currentTier.base_price, v.currency) }]
              : []),
          ]}
        />
      ) : null}
    </Screen>
  );
}
