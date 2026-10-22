import React, { useState } from "react";
import { Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Clock, Globe, LogOut, Plus, ShoppingBag, UserRound } from "lucide-react-native";
import {
  Button,
  Card,
  Header,
  Input,
  ListGroup,
  ListRow,
  Screen,
  Text,
  confirmDialog,
  errorMessage,
  toast,
} from "../../../components/ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { usePartnerVenue, useUpdateVenue, queryClient } from "../../../api/queries";
import { PartnerGate } from "../../../features/partner/PartnerGate";
import { usePartnerContext } from "../../../features/partner/usePartnerContext";
import { HoursEditor } from "../../../features/partner/HoursEditor";
import { useAuth } from "../../../stores/auth";
import { usePrefs } from "../../../stores/prefs";
import { unregisterPushToken } from "../../../lib/push";

export default function PartnerSettings() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const ctx = usePartnerContext();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const setPartnerAsCustomer = usePrefs((s) => s.setPartnerAsCustomer);
  const [hoursOpen, setHoursOpen] = useState(false);

  return (
    <Screen scroll keyboard>
      <Header
        large
        title={t("tabs.settings")}
        subtitle={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()}
      />
      <PartnerGate>
        {(venueId) => <VenueForm venueId={venueId} onHours={() => setHoursOpen(true)} />}
      </PartnerGate>

      <View style={{ marginTop: 20 }}>
        <ListGroup>
          <ListRow
            icon={<Plus size={20} color={colors.text} />}
            title={t("partner.addVenue")}
            onPress={() => router.push("/partner/register")}
          />
          <ListRow
            icon={<Globe size={20} color={colors.text} />}
            title={`${t("profile.language")} · ${t("profile.theme")}`}
            onPress={() => router.push("/profile/settings")}
          />
          <ListRow
            icon={<ShoppingBag size={20} color={colors.text} />}
            title={t("profile.switchToCustomer")}
            onPress={() => {
              setPartnerAsCustomer(true);
              router.replace("/");
            }}
          />
          <ListRow
            icon={<UserRound size={20} color={colors.text} />}
            title={t("profile.editProfile")}
            onPress={() => router.push("/profile/edit")}
          />
          <ListRow
            icon={<LogOut size={20} color={colors.danger} />}
            title={t("profile.logout")}
            danger
            onPress={async () => {
              if (
                !(await confirmDialog({
                  title: t("profile.logoutConfirm"),
                  confirmLabel: t("profile.logout"),
                  destructive: true,
                }))
              )
                return;
              await unregisterPushToken();
              await logout();
              queryClient.clear();
              router.replace("/");
            }}
          />
        </ListGroup>
      </View>
      {ctx.venueId ? (
        <HoursEditor venueId={ctx.venueId} visible={hoursOpen} onClose={() => setHoursOpen(false)} />
      ) : null}
    </Screen>
  );
}

function VenueForm({ venueId, onHours }: { venueId: number; onHours: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const q = usePartnerVenue(venueId);
  const update = useUpdateVenue(venueId);
  const [f, setF] = useState({
    name: "",
    tagline: "",
    description: "",
    phone: "",
    base_price: "",
    capacity_min: "",
    capacity_max: "",
    requires_deposit: false,
    deposit_percent: "",
    discount_percent: "",
  });

  // Venue ma'lumoti kelganda (yoki yangilanganda) formani to'ldirish
  const [loadedFrom, setLoadedFrom] = useState<typeof q.data>(undefined);
  if (q.data && q.data !== loadedFrom) {
    const v = q.data;
    setLoadedFrom(v);
    setF({
      name: v.name ?? "",
      tagline: v.tagline ?? "",
      description: v.description ?? "",
      phone: v.phone ?? "",
      base_price: v.base_price ? String(Math.round(Number(v.base_price))) : "",
      capacity_min: v.capacity_min ? String(v.capacity_min) : "",
      capacity_max: v.capacity_max ? String(v.capacity_max) : "",
      requires_deposit: v.requires_deposit,
      deposit_percent: v.deposit_percent ? String(Number(v.deposit_percent)) : "",
      discount_percent: v.discount_percent ? String(Number(v.discount_percent)) : "",
    });
  }

  const num = (s: string) => (s.trim() ? Number(s.replace(/[^\d.]/g, "")) : null);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const save = () =>
    update.mutate(
      {
        name: f.name.trim(),
        tagline: f.tagline.trim() || null,
        description: f.description.trim() || null,
        phone: f.phone.trim(),
        base_price: num(f.base_price),
        capacity_min: num(f.capacity_min),
        capacity_max: num(f.capacity_max),
        requires_deposit: f.requires_deposit,
        deposit_percent: f.requires_deposit ? num(f.deposit_percent) : null,
        discount_percent: num(f.discount_percent),
      },
      {
        onSuccess: () => toast.success(t("profile.saved")),
        onError: (e) => toast.error(errorMessage(e, t("common.errorGeneric"))),
      },
    );

  return (
    <Card>
      <Text variant="h2" style={{ marginBottom: 14 }}>
        {t("partner.venueProfile")}
      </Text>
      <View style={{ gap: 14 }}>
        <Input label={t("partner.venueName")} value={f.name} onChangeText={set("name")} />
        <Input label={t("partner.tagline")} value={f.tagline} onChangeText={set("tagline")} />
        <Input
          label={t("partner.description")}
          value={f.description}
          onChangeText={set("description")}
          multiline
        />
        <Input
          label={t("partner.phone")}
          value={f.phone}
          onChangeText={set("phone")}
          keyboardType="phone-pad"
        />
        <Input
          label={t("partner.basePrice")}
          value={f.base_price}
          onChangeText={set("base_price")}
          keyboardType="number-pad"
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Input
            containerStyle={{ flex: 1 }}
            label={t("partner.capacityMin")}
            value={f.capacity_min}
            onChangeText={set("capacity_min")}
            keyboardType="number-pad"
          />
          <Input
            containerStyle={{ flex: 1 }}
            label={t("partner.capacityMax")}
            value={f.capacity_max}
            onChangeText={set("capacity_max")}
            keyboardType="number-pad"
          />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text variant="bodyMedium" style={{ flex: 1 }}>
            {t("partner.requiresDeposit")}
          </Text>
          <Switch
            value={f.requires_deposit}
            onValueChange={(v) => setF((p) => ({ ...p, requires_deposit: v }))}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
          />
        </View>
        {f.requires_deposit ? (
          <Input
            label={`${t("partner.depositPercent")} (%)`}
            value={f.deposit_percent}
            onChangeText={set("deposit_percent")}
            keyboardType="decimal-pad"
          />
        ) : null}
        <Input
          label={`${t("partner.discountPercent")} (%)`}
          value={f.discount_percent}
          onChangeText={set("discount_percent")}
          keyboardType="decimal-pad"
        />
        <Button
          title={t("partner.editHours")}
          variant="secondary"
          icon={<Clock size={18} color={colors.text} />}
          onPress={onHours}
        />
        <Button
          title={t("common.save")}
          loading={update.isPending}
          disabled={!f.name.trim() || q.isLoading}
          onPress={save}
        />
      </View>
    </Card>
  );
}
