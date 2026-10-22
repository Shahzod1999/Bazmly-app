import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { haptic } from "../../lib/haptics";
import { Text } from "./Text";

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  chevron?: boolean;
}

export function ListRow({ title, subtitle, icon, right, onPress, danger, chevron = true }: ListRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={() => {
        haptic.selection();
        onPress?.();
      }}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.surface : "transparent" }]}
    >
      {icon ? (
        <View style={[styles.icon, { backgroundColor: danger ? colors.dangerSoft : colors.surface }]}>
          {icon}
        </View>
      ) : null}
      <View style={styles.flex}>
        <Text variant="bodyMedium" color={danger ? "danger" : "text"} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" color="textMuted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {onPress && chevron ? (
        <ChevronRight size={18} color={danger ? colors.danger : colors.textSubtle} />
      ) : null}
    </Pressable>
  );
}

export function ListGroup({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {items.map((child, i) => (
        <View key={i}>
          {child}
          {i < items.length - 1 ? <View style={[styles.sep, { backgroundColor: colors.border }]} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
  },
  icon: { width: 38, height: 38, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  group: { borderRadius: radius.xl, borderWidth: 1, overflow: "hidden" },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
});
