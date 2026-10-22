import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { haptic } from "../../lib/haptics";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

const HEIGHT: Record<Size, number> = { sm: 38, md: 48, lg: 56 };

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  icon,
  iconRight,
  fullWidth = true,
  style,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  const palette: Record<Variant, { bg: string; bgPressed: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, bgPressed: colors.primaryPressed, fg: colors.onPrimary },
    secondary: { bg: colors.surface, bgPressed: colors.border, fg: colors.text },
    outline: { bg: "transparent", bgPressed: colors.surface, fg: colors.primary, border: colors.primary },
    ghost: { bg: "transparent", bgPressed: colors.surface, fg: colors.primary },
    danger: { bg: colors.dangerSoft, bgPressed: colors.dangerSoft, fg: colors.danger },
    soft: { bg: colors.primarySoft, bgPressed: colors.primarySoft, fg: colors.primary },
  };
  const p = palette[variant];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        haptic.light();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHT[size],
          paddingHorizontal: size === "sm" ? 14 : 20,
          backgroundColor: pressed ? p.bgPressed : p.bg,
          borderColor: p.border ?? "transparent",
          borderWidth: p.border ? 1.5 : 0,
          opacity: inactive && !loading ? 0.5 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        variant === "primary" && !inactive ? styles.shadow : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text variant={size === "sm" ? "smallMedium" : "button"} color={p.fg} numberOfLines={1}>
            {title}
          </Text>
          {iconRight}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  shadow: {
    shadowColor: "#FF6B00",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
});
