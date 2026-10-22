import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp, Clock, LocateFixed, MapPin, Search } from "lucide-react-native";
import { Input, Sheet, Text, toast } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { geoService, userService, type DistrictRead } from "../../api";
import { qk, useDistricts, useRecentLocations, useRegions } from "../../api/queries";
import { usePrefs } from "../../stores/prefs";
import { useIsAuthed } from "../../stores/auth";
import { getCurrentLocation } from "../../lib/location";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function LocationSheet({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const authed = useIsAuthed();
  const { districtId, setDistrict } = usePrefs();
  const regions = useRegions();
  const recent = useRecentLocations();
  const [openRegion, setOpenRegion] = useState<number | null>(null);
  const districts = useDistricts(openRegion);
  const [query, setQuery] = useState("");
  const [detecting, setDetecting] = useState(false);

  const select = async (d: { id: number | null; label: string; lat?: number; lng?: number }) => {
    setDistrict(d.id, d.id ? d.label : null);
    onClose();
    toast.info(t("home.locationSelected", { label: d.label }));
    if (authed && d.id && d.lat !== undefined && d.lng !== undefined) {
      // Web versiyada bu yerda Toshkent koordinatasi hardcode qilingan edi — endi tuman koordinatasi
      await userService
        .saveRecentLocation({ district_id: d.id, label: d.label, latitude: d.lat, longitude: d.lng })
        .catch(() => {});
      void qc.invalidateQueries({ queryKey: qk.recentLocations });
    }
  };

  const detect = async () => {
    setDetecting(true);
    const res = await getCurrentLocation();
    if (!res.ok) {
      setDetecting(false);
      toast.error(t("home.locationDenied"));
      return;
    }
    try {
      const n = await geoService.getNearestDistrict(res.coords.latitude, res.coords.longitude);
      await select({
        id: n.district_id,
        label: `${n.region_name}, ${n.district_name}`,
        lat: res.coords.latitude,
        lng: res.coords.longitude,
      });
    } catch {
      toast.error(t("common.errorGeneric"));
    } finally {
      setDetecting(false);
    }
  };

  const q = query.trim().toLowerCase();
  const filteredRegions = useMemo(
    () => (regions.data ?? []).filter((r) => !q || r.name.toLowerCase().includes(q)),
    [regions.data, q],
  );
  const districtRow = (d: DistrictRead, regionName: string) => {
    const active = d.id === districtId;
    return (
      <Pressable
        key={d.id}
        onPress={() =>
          select({
            id: d.id,
            label: `${regionName}, ${d.name}`,
            lat: Number(d.latitude),
            lng: Number(d.longitude),
          })
        }
        style={[styles.district, active && { backgroundColor: colors.primarySoft }]}
        accessibilityRole="button"
      >
        <Text variant="body" style={{ flex: 1 }} color={active ? "primary" : "text"}>
          {d.name}
        </Text>
        {active ? <Check size={18} color={colors.primary} /> : null}
      </Pressable>
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t("home.chooseLocation")} scrollable>
      <Pressable
        onPress={detect}
        disabled={detecting}
        style={[styles.detect, { backgroundColor: colors.primarySoft }]}
        accessibilityRole="button"
      >
        {detecting ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <LocateFixed size={20} color={colors.primary} />
        )}
        <Text variant="bodyMedium" color="primary">
          {detecting ? t("home.detectingLocation") : t("home.detectLocation")}
        </Text>
      </Pressable>

      <Input
        placeholder={t("home.locationSearch")}
        value={query}
        onChangeText={setQuery}
        left={<Search size={18} color={colors.textSubtle} />}
        containerStyle={{ marginTop: 14 }}
      />

      <Pressable
        onPress={() => select({ id: null, label: t("home.allDistricts") })}
        style={[styles.district, { marginTop: 12 }, !districtId && { backgroundColor: colors.primarySoft }]}
      >
        <MapPin size={18} color={colors.textMuted} />
        <Text variant="bodyMedium" style={{ flex: 1 }}>
          {t("home.allDistricts")}
        </Text>
        {!districtId ? <Check size={18} color={colors.primary} /> : null}
      </Pressable>

      {recent.data && recent.data.length > 0 && !q ? (
        <View style={{ marginTop: 12 }}>
          <Text variant="smallMedium" color="textMuted" style={{ marginBottom: 6 }}>
            {t("home.recentLocations")}
          </Text>
          {recent.data.slice(0, 3).map((r) => (
            <Pressable
              key={r.id}
              onPress={() =>
                select({
                  id: r.district_id,
                  label: r.label,
                  lat: Number(r.latitude),
                  lng: Number(r.longitude),
                })
              }
              style={styles.district}
            >
              <Clock size={16} color={colors.textMuted} />
              <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={{ marginTop: 8 }}>
        {regions.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : null}
        {filteredRegions.map((r) => {
          const open = openRegion === r.id;
          return (
            <View key={r.id} style={[styles.region, { borderColor: colors.border }]}>
              <Pressable
                onPress={() => setOpenRegion(open ? null : r.id)}
                style={styles.regionHead}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
              >
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {r.name}
                </Text>
                {open ? (
                  <ChevronUp size={18} color={colors.textMuted} />
                ) : (
                  <ChevronDown size={18} color={colors.textMuted} />
                )}
              </Pressable>
              {open ? (
                <View style={{ paddingBottom: 8 }}>
                  {districts.isLoading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
                  ) : (districts.data ?? []).length === 0 ? (
                    <Text variant="small" color="textMuted" style={{ padding: 12 }}>
                      {t("home.districtsEmpty")}
                    </Text>
                  ) : (
                    (districts.data ?? []).map((d) => districtRow(d, r.name))
                  )}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  detect: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: radius.lg,
  },
  district: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    minHeight: 46,
    borderRadius: radius.md,
  },
  region: { borderBottomWidth: StyleSheet.hairlineWidth },
  regionHead: { flexDirection: "row", alignItems: "center", minHeight: 52, paddingHorizontal: 4 },
});
