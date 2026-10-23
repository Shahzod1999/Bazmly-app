import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ImagePlus, LocateFixed, Store, UtensilsCrossed, X } from "lucide-react-native";
import {
  Button,
  Card,
  Chip,
  Input,
  PhoneInput,
  Screen,
  Text,
  errorMessage,
  toast,
} from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { useCreateGroupWithBranch, useDistricts, useRegions } from "../../api/queries";
import { partnerService, type VenueTypeSlug } from "../../api";
import { WizardHeader } from "../../features/booking/StepHeader";
import { OptionCard } from "../../features/booking/OptionCard";
import { GuestGate } from "../../features/auth/GuestGate";
import { useAuth, isPartner } from "../../stores/auth";
import { usePrefs } from "../../stores/prefs";
import { useBranchStore } from "../../features/partner/usePartnerContext";
import { getCurrentLocation } from "../../lib/location";
import { toE164 } from "../../lib/format";

const TOTAL = 4;

/**
 * Hamkor ro'yxatdan o'tishi: turi → manzil → sig'im/narx → suratlar → POST /venue/groups.
 * Avval foydalanuvchi SMS orqali kirgan bo'lishi shart (akkaunt avtomatik yaratilmaydi).
 */
const TABLE_SIZES = ["2", "4", "6", "8"] as const;
type TableSize = (typeof TABLE_SIZES)[number];

export default function PartnerRegister() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const authed = useAuth((s) => s.status === "authed");
  const user = useAuth((s) => s.user);
  const refreshUser = useAuth((s) => s.refreshUser);
  const create = useCreateGroupWithBranch();
  const regions = useRegions();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [locating, setLocating] = useState(false);
  // Qayta urinishda yangi tarmoq yaratilmasligi uchun (backend: bitta egaga bitta tarmoq)
  const [createdVenueId, setCreatedVenueId] = useState<number | null>(null);
  const [tablesCreated, setTablesCreated] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [f, setF] = useState({
    type: "toyxona" as VenueTypeSlug,
    groupName: "",
    venueName: "",
    regionId: null as number | null,
    districtId: null as number | null,
    street: "",
    house: "",
    lat: null as number | null,
    lng: null as number | null,
    phone: (user?.phone ?? "").replace(/\D/g, "").slice(-9),
    capMin: "",
    capMax: "",
    // Restoran stollari: necha kishilik → nechta (backend TableCountsCreate: {2: 4, 4: 6})
    tables: { "2": "2", "4": "4", "6": "2", "8": "0" } as Record<TableSize, string>,
    price: "",
    requiresDeposit: true,
    depositPercent: "10",
    photos: [] as string[],
  });
  const districts = useDistricts(f.regionId);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const district = useMemo(
    () => districts.data?.find((d) => d.id === f.districtId),
    [districts.data, f.districtId],
  );

  if (!authed) {
    return (
      <Screen>
        <WizardHeader
          title={t("partnerRegister.title")}
          step={0}
          total={TOTAL}
          onBack={() => router.back()}
        />
        <GuestGate redirect="/partner/register" />
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen
        footer={
          <Button
            title={t("partnerRegister.toPanel")}
            size="lg"
            onPress={() => router.replace(isPartner() ? "/partner" : "/")}
          />
        }
      >
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 12 }}
        >
          <CheckCircle2 size={80} color={colors.success} />
          <Text variant="display" align="center">
            {t("partnerRegister.finishTitle")}
          </Text>
          <Text variant="body" color="textMuted" align="center">
            {t("partnerRegister.finishText")}
          </Text>
        </View>
      </Screen>
    );
  }

  const isHall = f.type === "toyxona";
  const tableCounts = Object.fromEntries(
    TABLE_SIZES.map((s) => [s, Number(f.tables[s] || 0)]).filter(([, n]) => Number(n) > 0),
  ) as Record<string, number>;
  const restaurantSeats = Object.entries(tableCounts).reduce((sum, [s, n]) => sum + Number(s) * n, 0);
  const canNext =
    (step === 0 && f.groupName.trim().length > 1 && f.venueName.trim().length > 1) ||
    (step === 1 && !!f.districtId && f.street.trim().length > 1 && f.house.trim().length > 0) ||
    // To'yxonada narx majburiy: backend yagona narx bosqichini base_price dan yaratadi, narxsiz zalni bron qilib bo'lmaydi
    (step === 2 && f.phone.length === 9 && (isHall ? !!f.capMax && !!f.price : restaurantSeats > 0)) ||
    step === 3;

  const locate = async () => {
    setLocating(true);
    const r = await getCurrentLocation();
    setLocating(false);
    if (!r.ok) return toast.error(t("home.locationDenied"));
    setF((p) => ({ ...p, lat: r.coords.latitude, lng: r.coords.longitude }));
  };

  const pickPhotos = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.7,
    });
    if (!res.canceled) set("photos", [...f.photos, ...res.assets.map((a) => a.uri)].slice(0, 10));
  };

  const submit = async () => {
    const lat = f.lat ?? (district ? Number(district.latitude) : null);
    const lng = f.lng ?? (district ? Number(district.longitude) : null);
    if (!f.districtId || lat === null || lng === null) return;
    const n = (s: string) => (s.trim() ? Number(s.replace(/\D/g, "")) : null);
    setFinishing(true);
    try {
      // 1) Tarmoq + birinchi filial (backend egani venue_staff'ga yozadi)
      let venueId = createdVenueId;
      if (!venueId) {
        const res = await create.mutateAsync({
          group: { name: f.groupName.trim(), primary_venue_type: f.type },
          branch: {
            name: f.venueName.trim(),
            venue_type: f.type,
            district_id: f.districtId,
            street: f.street.trim(),
            house_number: f.house.trim(),
            latitude: lat,
            longitude: lng,
            phone: toE164(f.phone),
            total_seats: isHall ? n(f.capMax) : restaurantSeats,
            capacity_min: isHall ? n(f.capMin) : null,
            capacity_max: isHall ? n(f.capMax) : restaurantSeats,
            base_price: n(f.price),
            requires_deposit: f.requiresDeposit,
            deposit_percent: f.requiresDeposit ? n(f.depositPercent) : null,
          },
        });
        venueId = res.branches[0]?.id ?? null;
        if (!venueId) throw new Error(t("common.errorGeneric"));
        setCreatedVenueId(venueId);
        useBranchStore.getState().setVenueId(venueId);
      }
      // 2) Restoran stollari
      if (!isHall && !tablesCreated) {
        await partnerService.createTablesBulk(venueId, { counts: tableCounts });
        setTablesCreated(true);
      }
      // 3) Onboarding qadamlari → `finish` muassasani `active` qiladi (qidiruvda ko'rinadi).
      // Suratlarni yuklash API'si yo'q (BACKEND_CONTRACT → qolgan masalalar §3) — media qadami bo'sh o'tkaziladi.
      await partnerService.onboardingTablesDone(venueId);
      await partnerService.onboardingServicesDone(venueId);
      await partnerService.onboardingMediaDone(venueId);
      await partnerService.onboardingFinish(venueId);
      usePrefs.getState().setPartnerAsCustomer(false);
      await refreshUser();
      setDone(true);
    } catch (e) {
      toast.error(errorMessage(e, t("common.errorGeneric")));
    } finally {
      setFinishing(false);
    }
  };

  return (
    <Screen
      scroll
      keyboard
      footer={
        step < TOTAL - 1 ? (
          <Button title={t("common.next")} size="lg" disabled={!canNext} onPress={() => setStep(step + 1)} />
        ) : (
          <Button title={t("partnerRegister.submit")} size="lg" loading={finishing} onPress={submit} />
        )
      }
    >
      <WizardHeader
        title={t("partnerRegister.title")}
        subtitle={t("booking.step", { current: step + 1, total: TOTAL })}
        step={step}
        total={TOTAL}
        onBack={() => (step === 0 ? router.back() : setStep(step - 1))}
      />

      {step === 0 ? (
        <View style={{ gap: 14 }}>
          <Text variant="h1">{t("partnerRegister.typeTitle")}</Text>
          <OptionCard
            active={f.type === "toyxona"}
            icon={<Store size={22} color={colors.primary} />}
            title={t("partnerRegister.hall")}
            onPress={() => set("type", "toyxona")}
          />
          <OptionCard
            active={f.type === "restoran"}
            icon={<UtensilsCrossed size={22} color={colors.primary} />}
            title={t("partnerRegister.restaurant")}
            onPress={() => set("type", "restoran")}
          />
          <Input
            label={t("partnerRegister.groupName")}
            value={f.groupName}
            onChangeText={(v) => set("groupName", v)}
            containerStyle={{ marginTop: 8 }}
          />
          <Input
            label={t("partnerRegister.venueName")}
            value={f.venueName}
            onChangeText={(v) => set("venueName", v)}
          />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={{ gap: 14 }}>
          <Text variant="h1">{t("partnerRegister.addressTitle")}</Text>
          <Text variant="smallMedium" color="textMuted">
            {t("partnerRegister.region")}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(regions.data ?? []).map((r) => (
              <Chip
                key={r.id}
                label={r.name}
                selected={f.regionId === r.id}
                onPress={() => setF((p) => ({ ...p, regionId: r.id, districtId: null }))}
              />
            ))}
          </ScrollView>
          {f.regionId ? (
            <>
              <Text variant="smallMedium" color="textMuted">
                {t("partnerRegister.district")}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {(districts.data ?? []).map((d) => (
                  <Chip
                    key={d.id}
                    label={d.name}
                    selected={f.districtId === d.id}
                    onPress={() => set("districtId", d.id)}
                  />
                ))}
              </View>
            </>
          ) : null}
          <Input
            label={t("partnerRegister.street")}
            value={f.street}
            onChangeText={(v) => set("street", v)}
          />
          <Input
            label={t("partnerRegister.house")}
            value={f.house}
            onChangeText={(v) => set("house", v)}
            containerStyle={{ width: 160 }}
          />
          <Card>
            <Text variant="bodyMedium">{t("partnerRegister.pinOnMap")}</Text>
            <Text variant="small" color="textMuted" style={{ marginVertical: 6 }}>
              {f.lat !== null
                ? `${f.lat.toFixed(5)}, ${f.lng?.toFixed(5)}`
                : district
                  ? `${district.name}: ${Number(district.latitude).toFixed(4)}, ${Number(district.longitude).toFixed(4)}`
                  : "—"}
            </Text>
            <Button
              title={t("home.detectLocation")}
              variant="soft"
              size="sm"
              loading={locating}
              icon={<LocateFixed size={16} color={colors.primary} />}
              onPress={locate}
            />
          </Card>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ gap: 14 }}>
          <Text variant="h1">{t("partnerRegister.capacityTitle")}</Text>
          {isHall ? (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Input
                containerStyle={{ flex: 1 }}
                label={t("partner.capacityMin")}
                value={f.capMin}
                onChangeText={(v) => set("capMin", v.replace(/\D/g, ""))}
                keyboardType="number-pad"
              />
              <Input
                containerStyle={{ flex: 1 }}
                label={t("partner.capacityMax")}
                value={f.capMax}
                onChangeText={(v) => set("capMax", v.replace(/\D/g, ""))}
                keyboardType="number-pad"
              />
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <Text variant="smallMedium" color="textMuted">
                {t("partnerRegister.tablesTitle")}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {TABLE_SIZES.map((size) => (
                  <Input
                    key={size}
                    containerStyle={{ flex: 1 }}
                    label={t("partnerRegister.tableSize", { count: Number(size) })}
                    value={f.tables[size]}
                    onChangeText={(v) =>
                      set("tables", { ...f.tables, [size]: v.replace(/\D/g, "").slice(0, 3) })
                    }
                    keyboardType="number-pad"
                    accessibilityLabel={t("partnerRegister.tableSizeA11y", { count: Number(size) })}
                  />
                ))}
              </View>
              <Text variant="small" color="textMuted">
                {t("partnerRegister.tablesTotal", {
                  tables: Object.values(tableCounts).reduce((a, b) => a + b, 0),
                  seats: restaurantSeats,
                })}
              </Text>
            </View>
          )}
          <Input
            label={t("partner.basePrice")}
            value={f.price}
            onChangeText={(v) => set("price", v.replace(/\D/g, ""))}
            keyboardType="number-pad"
            right={
              <Text variant="small" color="textMuted">
                {t("currency.uzs")}
              </Text>
            }
          />
          <PhoneInput label={t("partner.phone")} value={f.phone} onChangeText={(v) => set("phone", v)} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Chip
              label={t("home.deposit")}
              selected={f.requiresDeposit}
              onPress={() => set("requiresDeposit", true)}
            />
            <Chip
              label={t("home.noDeposit")}
              selected={!f.requiresDeposit}
              onPress={() => set("requiresDeposit", false)}
            />
          </View>
          {f.requiresDeposit ? (
            <Input
              label={`${t("partner.depositPercent")} (%)`}
              value={f.depositPercent}
              onChangeText={(v) => set("depositPercent", v.replace(/\D/g, "").slice(0, 2))}
              keyboardType="number-pad"
              containerStyle={{ width: 180 }}
            />
          ) : null}
        </View>
      ) : null}

      {step === 3 ? (
        <View style={{ gap: 14 }}>
          <Text variant="h1">{t("partnerRegister.photosTitle")}</Text>
          <Text variant="small" color="textMuted">
            {t("partnerRegister.photosHint")}
          </Text>
          <View style={styles.photos}>
            {f.photos.map((uri) => (
              <View key={uri}>
                <Image source={{ uri }} style={styles.photo} contentFit="cover" />
                <Pressable
                  onPress={() =>
                    set(
                      "photos",
                      f.photos.filter((p) => p !== uri),
                    )
                  }
                  style={styles.remove}
                  accessibilityLabel={t("common.delete")}
                >
                  <X size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={pickPhotos}
              style={[
                styles.photo,
                styles.add,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("partnerRegister.addPhotos")}
            >
              <ImagePlus size={26} color={colors.primary} />
            </Pressable>
          </View>
          <Text variant="small" color="warning">
            {t("partnerRegister.photosUploadNote")}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photos: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photo: { width: 100, height: 100, borderRadius: radius.md },
  add: { borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
});
