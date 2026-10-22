import React from "react";
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
  accessibilityLabel?: string;
}

export function Card({
  children,
  onPress,
  style,
  padded = true,
  elevated = true,
  accessibilityLabel,
}: CardProps) {
  const { colors, isDark } = useTheme();
  const base = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      padding: padded ? 16 : 0,
    },
    elevated && !isDark ? styles.shadow : null,
    style,
  ];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      // web'da ichma-ich <button> bo'lmasligi uchun (kartaning ichida sevimli tugmasi bor)
      accessibilityRole={Platform.OS === "web" ? undefined : "button"}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        ...base,
        { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, borderWidth: 1, overflow: "hidden" },
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
});
