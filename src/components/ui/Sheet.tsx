import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { MAX_CONTENT_WIDTH, radius } from "../../theme/tokens";
import { Text } from "./Text";
import { IconButton } from "./IconButton";
import i18n from "../../i18n";

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Kontent scroll bo'lsinmi (uzun ro'yxatlar uchun) */
  scrollable?: boolean;
  /** Maksimal balandlik ekranga nisbatan */
  maxHeightRatio?: number;
  dismissible?: boolean;
}

/**
 * Bottom sheet — web'dagi modal'lar o'rniga.
 * Pastga tortib yopish, fon bosilsa yopish, klaviatura bilan ko'tariladi.
 */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  scrollable = false,
  maxHeightRatio = 0.88,
  dismissible = true,
}: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const screenH = Dimensions.get("window").height;
  // Animated.Value bir marta yaratiladi (useState lazy init — render paytida ref o'qilmaydi)
  const [translateY] = useState(() => new Animated.Value(screenH));
  const [backdrop] = useState(() => new Animated.Value(0));
  const [mounted, setMounted] = useState(visible);
  // Ochilganda darhol mount qilamiz (render paytida holatni moslash — effektsiz)
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.timing(backdrop, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: screenH, duration: 220, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => dismissible && g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) translateY.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 120 || g.vy > 1.2) onClose();
          else Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22 }).start();
        },
      }),
    [dismissible, onClose, translateY],
  );

  if (!mounted) return null;

  const Body = scrollable ? ScrollView : View;

  return (
    <Modal
      transparent
      visible={mounted}
      onRequestClose={dismissible ? onClose : () => {}}
      statusBarTranslucent
      animationType="none"
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.fill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, opacity: backdrop }]}
        >
          <Pressable
            style={styles.fill}
            onPress={dismissible ? onClose : undefined}
            accessibilityRole="button"
            accessibilityLabel={i18n.t("common.close")}
          />
        </Animated.View>
        <View style={styles.anchor} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                maxHeight: screenH * maxHeightRatio,
                paddingBottom: Math.max(insets.bottom, 16),
                transform: [{ translateY }],
              },
            ]}
          >
            <View {...pan.panHandlers} style={styles.handleArea}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              {title ? (
                <View style={styles.header}>
                  <View style={styles.flex}>
                    <Text variant="h2">{title}</Text>
                    {subtitle ? (
                      <Text variant="small" color="textMuted" style={{ marginTop: 2 }}>
                        {subtitle}
                      </Text>
                    ) : null}
                  </View>
                  {dismissible ? (
                    <IconButton
                      icon={<X size={20} color={colors.text} />}
                      onPress={onClose}
                      accessibilityLabel={i18n.t("common.close")}
                      size={36}
                    />
                  ) : null}
                </View>
              ) : null}
            </View>
            <Body
              style={scrollable ? styles.scroll : styles.body}
              contentContainerStyle={scrollable ? styles.scrollContent : undefined}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </Body>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  anchor: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  sheet: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH + 80,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
  },
  handleArea: { paddingTop: 10, paddingHorizontal: 20 },
  handle: { width: 40, height: 5, borderRadius: 3, alignSelf: "center", marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
});
