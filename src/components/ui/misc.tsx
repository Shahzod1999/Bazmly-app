import React from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Minus, Plus, Star } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { haptic } from "../../lib/haptics";
import { initials } from "../../lib/format";
import { Text } from "./Text";
import i18n from "../../i18n";

export function Avatar({
  uri,
  firstName,
  lastName,
  size = 48,
}: {
  uri?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: number;
}) {
  const { colors } = useTheme();
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primarySoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text variant={size > 60 ? "h1" : "h3"} color="primary">
        {initials(firstName, lastName)}
      </Text>
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 5000,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const { colors } = useTheme();
  const btn = (disabled: boolean, onPress: () => void, icon: React.ReactNode, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      style={({ pressed }) => [
        styles.stepBtn,
        { backgroundColor: colors.card, opacity: disabled ? 0.35 : pressed ? 0.7 : 1 },
      ]}
    >
      {icon}
    </Pressable>
  );
  return (
    <View style={[styles.stepper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {btn(
        value <= min,
        () => onChange(Math.max(min, value - step)),
        <Minus size={20} color={colors.text} />,
        i18n.t("a11y.decrease"),
      )}
      <Text variant="h2" tabular style={styles.stepValue} accessibilityLiveRegion="polite">
        {value}
      </Text>
      {btn(
        value >= max,
        () => onChange(Math.min(max, value + step)),
        <Plus size={20} color={colors.text} />,
        i18n.t("a11y.increase"),
      )}
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              haptic.selection();
              onChange(o.value);
            }}
            style={[styles.segmentItem, active && { backgroundColor: colors.primary }]}
          >
            <Text
              variant="smallMedium"
              color={active ? colors.onPrimary : colors.textMuted}
              numberOfLines={1}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function RatingStars({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }} accessibilityLabel={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          disabled={!onChange}
          accessibilityRole="button"
          accessibilityLabel={`${n}`}
          onPress={() => {
            haptic.selection();
            onChange?.(n);
          }}
        >
          <Star size={size} color="#F59E0B" fill={n <= value ? "#F59E0B" : "transparent"} />
        </Pressable>
      ))}
    </View>
  );
}

export function RatingInline({ rating, count }: { rating: string | number; count?: string }) {
  return (
    <View style={styles.ratingRow}>
      <Star size={15} color="#F59E0B" fill="#F59E0B" />
      <Text variant="smallMedium">{Number(rating || 0).toFixed(1)}</Text>
      {count ? (
        <Text variant="small" color="textMuted">
          ({count})
        </Text>
      ) : null}
    </View>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.section, style]}>
      <Text variant="h2" style={{ flex: 1 }}>
        {title}
      </Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Text variant="smallMedium" color="primary">
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }, style]} />;
}

export function KeyValue({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.kv}>
      <Text variant="small" color="textMuted" style={{ flexShrink: 0 }}>
        {label}
      </Text>
      <Text variant={strong ? "h3" : "smallMedium"} align="right" style={{ flex: 1 }} tabular>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  stepBtn: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  stepValue: { minWidth: 64, textAlign: "center" },
  segment: { flexDirection: "row", padding: 4, borderRadius: radius.lg, borderWidth: 1 },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  section: { flexDirection: "row", alignItems: "center", marginTop: 24, marginBottom: 12 },
  kv: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
});
