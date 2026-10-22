import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { Text } from "./Text";

export type BadgeTone = "primary" | "success" | "danger" | "warning" | "info" | "neutral";

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: React.ReactNode;
  solid?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, tone = "neutral", icon, solid, style }: BadgeProps) {
  const { colors } = useTheme();
  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    primary: { bg: colors.primarySoft, fg: colors.primary },
    success: { bg: colors.successSoft, fg: colors.success },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    info: { bg: colors.infoSoft, fg: colors.info },
    neutral: { bg: colors.surface, fg: colors.textMuted },
  };
  const c = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: solid ? c.fg : c.bg }, style]}>
      {icon}
      <Text variant="caption" color={solid ? "#fff" : c.fg} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Kichik "● Ochiq" indikatori */
export function StatusDot({ open, label }: { open: boolean; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dotRow}>
      <View style={[styles.dot, { backgroundColor: open ? colors.success : colors.danger }]} />
      <Text variant="smallMedium" color={open ? "success" : "danger"}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  dotRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
