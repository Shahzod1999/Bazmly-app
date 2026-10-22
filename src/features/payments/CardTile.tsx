import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Check } from "lucide-react-native";
import { Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import type { SavedCard } from "../../api";

export function CardTile({
  card,
  selected,
  onPress,
  right,
}: {
  card: SavedCard;
  selected?: boolean;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const humo = card.brand === "humo";
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "radio" : undefined}
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={card.masked_pan}
      style={[
        styles.row,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primarySoft : colors.card,
        },
      ]}
    >
      <View style={[styles.brand, { backgroundColor: humo ? "#0F766E" : "#1D4ED8" }]}>
        <Text variant="caption" color="#fff">
          {humo ? "HUMO" : "UZCARD"}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium" tabular>
          {card.masked_pan}
        </Text>
        <Text variant="small" color="textMuted">
          {card.expiry}
          {card.holder_name ? ` · ${card.holder_name}` : ""}
        </Text>
      </View>
      {right}
      {onPress ? (
        <View
          style={[
            styles.radio,
            {
              borderColor: selected ? colors.primary : colors.border,
              backgroundColor: selected ? colors.primary : "transparent",
            },
          ]}
        >
          {selected ? <Check size={14} color="#fff" /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

/** To'lov sahifasi tepasidagi "BAZMLY Pay" kartasi (web dizayniga mos) */
export function PayHero({ amount, label }: { amount: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.hero, { backgroundColor: colors.primary }]}>
      <Text variant="caption" color="rgba(255,255,255,0.8)">
        BAZMLY PAY
      </Text>
      <Text variant="h2" color="#fff" style={{ marginTop: 2 }}>
        UZCARD / HUMO
      </Text>
      <View style={{ marginTop: 28 }}>
        <Text variant="caption" color="rgba(255,255,255,0.8)">
          {label}
        </Text>
        <Text variant="display" color="#fff" tabular>
          {amount}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  brand: { width: 56, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    borderRadius: radius.xxl,
    padding: 22,
    shadowColor: "#FF6B00",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
});
