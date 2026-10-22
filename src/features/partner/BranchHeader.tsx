import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Store } from "lucide-react-native";
import { Sheet, StatusDot, Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { usePartnerContext } from "./usePartnerContext";

/** Panel tepasi: guruh nomi + filial tanlash */
export function BranchHeader({ right, isOpen }: { right?: React.ReactNode; isOpen?: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const ctx = usePartnerContext();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
        <Store size={22} color={colors.primary} />
      </View>
      <Pressable
        style={{ flex: 1 }}
        onPress={() => ctx.venues.length > 1 && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t("partner.switchBranch")}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text variant="h3" numberOfLines={1} style={{ flexShrink: 1 }}>
            {ctx.venue?.name ?? ctx.group?.name ?? t("partner.panel")}
          </Text>
          {ctx.venues.length > 1 ? <ChevronDown size={16} color={colors.textMuted} /> : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {ctx.group?.name}
          </Text>
          {isOpen !== undefined ? (
            <StatusDot open={isOpen} label={isOpen ? t("partner.openNow") : t("partner.closedNow")} />
          ) : null}
        </View>
      </Pressable>
      {right}
      <Sheet visible={open} onClose={() => setOpen(false)} title={t("partner.branches")}>
        <View style={{ gap: 8, paddingBottom: 8 }}>
          {ctx.venues.map((v) => {
            const active = v.id === ctx.venueId;
            return (
              <Pressable
                key={v.id}
                onPress={() => {
                  ctx.setVenueId(v.id);
                  setOpen(false);
                }}
                style={[styles.branch, { backgroundColor: active ? colors.primarySoft : colors.surface }]}
              >
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {v.name}
                </Text>
                {active ? <Check size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 12, paddingBottom: 16 },
  icon: { width: 46, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  branch: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: radius.md },
});
