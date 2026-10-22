import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Check } from "lucide-react-native";
import { Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";

export function OptionCard({
  active,
  title,
  subtitle,
  icon,
  onPress,
  checkbox,
}: {
  active: boolean;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  checkbox?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={checkbox ? "checkbox" : "radio"}
      accessibilityState={{ checked: active }}
      style={[
        styles.option,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.primarySoft : colors.card,
        },
      ]}
    >
      {icon ? <View style={[styles.optIcon, { backgroundColor: colors.card }]}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        <Text variant="h3">{title}</Text>
        {subtitle ? (
          <Text variant="small" color="textMuted" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          checkbox ? styles.checkbox : styles.radio,
          {
            borderColor: active ? colors.primary : colors.border,
            backgroundColor: active ? colors.primary : "transparent",
          },
        ]}
      >
        {active ? <Check size={14} color="#fff" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  optIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
