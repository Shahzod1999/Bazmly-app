import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { ScanLine } from "lucide-react-native";
import { useTheme } from "../theme/ThemeProvider";
import { haptic } from "../lib/haptics";
import { Text } from "./ui";

export interface TabItem {
  name: string;
  label: string;
  icon: (p: { color: string; focused: boolean }) => React.ReactNode;
  badge?: number;
}

interface Props extends BottomTabBarProps {
  items: TabItem[];
  /** Markaziy tugma (tab emas — action). Berilmasa ko'rsatilmaydi */
  center?: { label: string; onPress: () => void; icon?: React.ReactNode } | null;
  /** Markaziy tugma nechanchi o'rinda turadi */
  centerIndex?: number;
}

/**
 * Web `bottom-nav.tsx` ga mos: 4 ta tab + markazda ko'tarilgan skaner tugmasi.
 */
export function AppTabBar({ state, emitter, navigateToTab, items, center, centerIndex = 2 }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const renderTab = (item: TabItem) => {
    const routeIndex = state.routes.findIndex((r) => r.name === item.name);
    if (routeIndex < 0) return null;
    const route = state.routes[routeIndex];
    const focused = state.index === routeIndex;
    const color = focused ? colors.primary : colors.textSubtle;
    return (
      <Pressable
        key={item.name}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={item.label}
        onPress={() => {
          haptic.selection();
          const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        }}
        style={styles.tab}
      >
        <View>
          {item.icon({ color, focused })}
          {item.badge ? (
            <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.tabBar }]} />
          ) : null}
        </View>
        <Text variant="caption" color={color} numberOfLines={1} style={{ marginTop: 4 }}>
          {item.label}
        </Text>
      </Pressable>
    );
  };

  const left = items.slice(0, centerIndex);
  const right = items.slice(centerIndex);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 10),
          shadowOpacity: isDark ? 0 : 0.06,
        },
      ]}
    >
      <View style={styles.inner}>
        {left.map(renderTab)}
        {center ? (
          <View style={styles.centerSlot}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={center.label}
              onPress={() => {
                haptic.light();
                center.onPress();
              }}
              style={({ pressed }) => [
                styles.centerBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                },
              ]}
            >
              <View style={[styles.centerInner, { backgroundColor: colors.primarySoft }]}>
                {center.icon ?? <ScanLine size={26} color={colors.primary} />}
              </View>
            </Pressable>
            <Text variant="caption" color="textSubtle" style={{ marginTop: 2 }}>
              {center.label}
            </Text>
          </View>
        ) : null}
        {right.map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    shadowColor: "#000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  inner: { flexDirection: "row", alignItems: "flex-end", maxWidth: 560, width: "100%", alignSelf: "center" },
  tab: { flex: 1, alignItems: "center", justifyContent: "flex-end", minHeight: 48, paddingTop: 4 },
  centerSlot: { flex: 1, alignItems: "center" },
  centerBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginTop: -30,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B00",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  centerInner: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -2, right: -4, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
});
