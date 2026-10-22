import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets, type Edge } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { MAX_CONTENT_WIDTH } from "../../theme/tokens";

interface ScreenProps {
  children: React.ReactNode;
  /** Scroll bo'ladigan ekran */
  scroll?: boolean;
  edges?: Edge[];
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Ekran pastida qotib turadigan blok (masalan, "Band qilish" tugmasi) */
  footer?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  keyboard?: boolean;
  scrollProps?: ScrollViewProps;
  background?: "background" | "surface";
}

/**
 * Har bir ekranning asosi: safe area, fon, planshetda markazlangan kontent (max 560),
 * pull-to-refresh, klaviatura bilan ishlash.
 */
export function Screen({
  children,
  scroll = false,
  edges = ["top"],
  padded = true,
  style,
  contentStyle,
  footer,
  refreshing,
  onRefresh,
  keyboard = false,
  scrollProps,
  background = "background",
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
  };
  const inner = [styles.inner, padded && styles.padded, contentStyle];

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, footer ? { paddingBottom: 120 } : { paddingBottom: 32 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      {...scrollProps}
    >
      <View style={inner}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.center]}>
      <View style={[inner, styles.flex]}>{children}</View>
    </View>
  );

  const content = (
    <View style={[styles.flex, { backgroundColor: colors[background] }, pad, style]}>
      {body}
      {footer ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors[background],
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <View style={styles.footerInner}>{footer}</View>
        </View>
      ) : null}
    </View>
  );

  if (!keyboard) return content;
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center" },
  scrollContent: { alignItems: "center", flexGrow: 1 },
  inner: { width: "100%", maxWidth: MAX_CONTENT_WIDTH },
  padded: { paddingHorizontal: 20 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  footerInner: { width: "100%", maxWidth: MAX_CONTENT_WIDTH },
});
