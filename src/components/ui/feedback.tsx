import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Info, WifiOff, XCircle } from "lucide-react-native";
import { useNetInfo } from "@react-native-community/netinfo";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { haptic } from "../../lib/haptics";
import { Text } from "./Text";
import { Button } from "./Button";
import { Sheet } from "./Sheet";
import { Input } from "./Input";

// ---------------- Toast ----------------

type ToastTone = "success" | "error" | "info";
interface ToastState {
  message: string | null;
  tone: ToastTone;
  key: number;
  show: (message: string, tone?: ToastTone) => void;
  hide: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  message: null,
  tone: "info",
  key: 0,
  show: (message, tone = "info") => set((s) => ({ message, tone, key: s.key + 1 })),
  hide: () => set({ message: null }),
}));

export const toast = {
  success: (m: string) => {
    haptic.success();
    useToastStore.getState().show(m, "success");
  },
  error: (m: string) => {
    haptic.error();
    useToastStore.getState().show(m, "error");
  },
  info: (m: string) => useToastStore.getState().show(m, "info"),
};

export function ToastHost() {
  const { message, tone, key, hide } = useToastStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [y] = useState(() => new Animated.Value(-120));

  useEffect(() => {
    if (!message) return;
    Animated.spring(y, { toValue: 0, useNativeDriver: true, damping: 18 }).start();
    const t = setTimeout(() => {
      Animated.timing(y, { toValue: -120, duration: 200, useNativeDriver: true }).start(() => hide());
    }, 2800);
    return () => clearTimeout(t);
  }, [key, message, hide, y]);

  if (!message) return null;
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? XCircle : Info;
  const iconColor = tone === "success" ? colors.success : tone === "error" ? colors.danger : colors.info;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.toastWrap, { top: insets.top + 8, transform: [{ translateY: y }] }]}
    >
      <View style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Icon size={20} color={iconColor} />
        <Text variant="smallMedium" style={{ flex: 1 }}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

// ---------------- Confirm / Prompt dialog ----------------

interface DialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Matn kiritish maydoni (masalan, bekor qilish sababi) */
  input?: { placeholder?: string; label?: string };
}

interface DialogState {
  options: DialogOptions | null;
  resolve: ((v: { confirmed: boolean; text: string }) => void) | null;
  open: (o: DialogOptions) => Promise<{ confirmed: boolean; text: string }>;
  close: (confirmed: boolean, text: string) => void;
}

const useDialogStore = create<DialogState>((set, get) => ({
  options: null,
  resolve: null,
  open: (options) =>
    new Promise((resolve) => {
      set({ options, resolve });
    }),
  close: (confirmed, text) => {
    get().resolve?.({ confirmed, text });
    set({ options: null, resolve: null });
  },
}));

/** Tasdiqlash oynasi: `if (await confirmDialog({...})) ...` */
export async function confirmDialog(o: Omit<DialogOptions, "input">): Promise<boolean> {
  const r = await useDialogStore.getState().open(o);
  return r.confirmed;
}

/** Matn so'raydigan oynani ochadi; bekor qilinsa null */
export async function promptDialog(o: DialogOptions): Promise<string | null> {
  const r = await useDialogStore.getState().open({ ...o, input: o.input ?? {} });
  return r.confirmed ? r.text : null;
}

export function DialogHost() {
  const { options, close } = useDialogStore();
  const { t } = useTranslation();
  const [text, setText] = useState("");
  // Yangi dialog ochilganda matnni tozalash (render paytida, effektsiz)
  const [prevOptions, setPrevOptions] = useState(options);
  if (prevOptions !== options) {
    setPrevOptions(options);
    if (options) setText("");
  }
  return (
    <Sheet visible={!!options} onClose={() => close(false, "")} title={options?.title}>
      {options?.message ? (
        <Text variant="body" color="textMuted" style={{ marginBottom: 16 }}>
          {options.message}
        </Text>
      ) : null}
      {options?.input ? (
        <Input
          label={options.input.label}
          placeholder={options.input.placeholder}
          value={text}
          onChangeText={setText}
          multiline
          containerStyle={{ marginBottom: 16 }}
        />
      ) : null}
      <View style={{ gap: 10 }}>
        <Button
          title={options?.confirmLabel ?? t("common.confirm")}
          variant={options?.destructive ? "danger" : "primary"}
          onPress={() => close(true, text)}
        />
        <Button
          title={options?.cancelLabel ?? t("common.cancel")}
          variant="secondary"
          onPress={() => close(false, "")}
        />
      </View>
    </Sheet>
  );
}

// ---------------- Offline banner ----------------

export function OfflineBanner() {
  const net = useNetInfo();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  if (net.isConnected !== false) return null;
  return (
    <View style={[styles.offline, { backgroundColor: colors.danger, paddingTop: insets.top + 4 }]}>
      <WifiOff size={14} color="#fff" />
      <Text variant="caption" color="#fff">
        {t("common.offline")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: "absolute", left: 16, right: 16, alignItems: "center", zIndex: 1000 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: 520,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  offline: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 6,
    zIndex: 999,
  },
});
