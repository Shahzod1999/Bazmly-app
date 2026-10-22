import React from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { haptic } from "../../lib/haptics";
import { Text } from "./Text";

export interface IconButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  variant?: "surface" | "plain" | "overlay" | "primary";
  size?: number;
  badge?: number | boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = "surface",
  size = 44,
  badge,
  style,
  disabled,
}: IconButtonProps) {
  const { colors } = useTheme();
  const bg =
    variant === "surface"
      ? colors.card
      : variant === "overlay"
        ? "rgba(0,0,0,0.35)"
        : variant === "primary"
          ? colors.primary
          : "transparent";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={6}
      onPress={() => {
        haptic.light();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2.6,
          backgroundColor: bg,
          borderWidth: variant === "surface" ? 1 : 0,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      {icon}
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.card }]}>
          {typeof badge === "number" ? (
            <Text variant="caption" color="#fff" style={{ fontSize: 9, lineHeight: 11 }}>
              {badge > 9 ? "9+" : badge}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
});
