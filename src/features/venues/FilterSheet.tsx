import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react-native";
import { Button, Chip, Sheet, Stepper, Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import type { VenueTypeSlug } from "../../api";

export type SortKey = "recommended" | "rating" | "price" | "distance";

export interface VenueFilters {
  venueType: VenueTypeSlug | null;
  guests: number | null;
  minRating: number | null;
  onlyDeposit: boolean;
  onlyOpen: boolean;
  sort: SortKey;
}

export const DEFAULT_FILTERS: VenueFilters = {
  venueType: null,
  guests: null,
  minRating: null,
  onlyDeposit: false,
  onlyOpen: false,
  sort: "recommended",
};

export function activeFilterCount(f: VenueFilters): number {
  return (
    (f.guests ? 1 : 0) +
    (f.minRating ? 1 : 0) +
    (f.onlyDeposit ? 1 : 0) +
    (f.onlyOpen ? 1 : 0) +
    (f.sort !== "recommended" ? 1 : 0)
  );
}

interface Props {
  visible: boolean;
  value: VenueFilters;
  onApply: (f: VenueFilters) => void;
  onClose: () => void;
}

export function FilterSheet({ visible, value, onApply, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [f, setF] = useState<VenueFilters>(value);
  // Sheet har ochilganda joriy filtrlardan boshlanadi (render paytida moslash)
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setF(value);
  }

  const set = <K extends keyof VenueFilters>(k: K, v: VenueFilters[K]) => setF((p) => ({ ...p, [k]: v }));

  const toggleRow = (label: string, v: boolean, onChange: (v: boolean) => void) => (
    <Pressable
      onPress={() => onChange(!v)}
      style={styles.toggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: v }}
    >
      <Text variant="bodyMedium" style={{ flex: 1 }}>
        {label}
      </Text>
      <Switch
        value={v}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor="#fff"
      />
    </Pressable>
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t("filters.title")}
      scrollable
      footer={
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button
            title={t("filters.reset")}
            variant="secondary"
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={() => setF(DEFAULT_FILTERS)}
          />
          <Button
            title={t("filters.apply")}
            fullWidth={false}
            style={{ flex: 2 }}
            onPress={() => {
              onApply(f);
              onClose();
            }}
          />
        </View>
      }
    >
      <Text variant="h3" style={styles.label}>
        {t("filters.venueType")}
      </Text>
      <View style={styles.wrap}>
        <Chip label={t("home.catAll")} selected={!f.venueType} onPress={() => set("venueType", null)} />
        <Chip
          label={t("home.catRestaurants")}
          selected={f.venueType === "restoran"}
          onPress={() => set("venueType", "restoran")}
        />
        <Chip
          label={t("home.catHalls")}
          selected={f.venueType === "toyxona"}
          onPress={() => set("venueType", "toyxona")}
        />
      </View>

      <Text variant="h3" style={styles.label}>
        {t("filters.guests")}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {f.guests ? (
          <Stepper
            value={f.guests}
            onChange={(v) => set("guests", v)}
            min={1}
            max={3000}
            step={f.guests >= 50 ? 10 : 1}
          />
        ) : null}
        <Chip
          label={f.guests ? t("filters.reset") : t("filters.guestsAny")}
          selected={!f.guests}
          onPress={() => set("guests", f.guests ? null : 4)}
        />
      </View>

      <Text variant="h3" style={styles.label}>
        {t("filters.minRating")}
      </Text>
      <View style={styles.wrap}>
        {[null, 4, 4.5].map((r) => (
          <Chip
            key={String(r)}
            label={r ? `${r}+` : t("filters.guestsAny")}
            icon={
              r ? (
                <Star
                  size={14}
                  color={f.minRating === r ? "#fff" : "#F59E0B"}
                  fill={f.minRating === r ? "#fff" : "#F59E0B"}
                />
              ) : undefined
            }
            selected={f.minRating === r}
            onPress={() => set("minRating", r)}
          />
        ))}
      </View>

      <View style={{ marginTop: 16 }}>
        {toggleRow(t("filters.onlyDeposit"), f.onlyDeposit, (v) => set("onlyDeposit", v))}
        {toggleRow(t("filters.onlyOpen"), f.onlyOpen, (v) => set("onlyOpen", v))}
      </View>

      <Text variant="h3" style={styles.label}>
        {t("filters.sort")}
      </Text>
      <View style={styles.wrap}>
        {(
          [
            ["recommended", t("filters.sortRecommended")],
            ["rating", t("filters.sortRating")],
            ["price", t("filters.sortPriceAsc")],
            ["distance", t("filters.sortDistance")],
          ] as [SortKey, string][]
        ).map(([k, label]) => (
          <Chip key={k} label={label} selected={f.sort === k} onPress={() => set("sort", k)} />
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: 18, marginBottom: 10 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toggle: { flexDirection: "row", alignItems: "center", minHeight: 52 },
});
