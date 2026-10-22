import React, { useRef, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";
import { Camera, Flashlight, FlashlightOff } from "lucide-react-native";
import { Button, IconButton, Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { haptic } from "../../lib/haptics";

interface Props {
  onScanned: (data: string) => void;
  /** Skanerlash vaqtincha to'xtatilsinmi (natija ko'rsatilayotganda) */
  paused?: boolean;
  hint?: string;
}

/** Kamera ruxsati → skanerlash. Bir xil kodni 2 soniya ichida qayta o'qimaydi. */
export function QrScanner({ onScanned, paused, hint }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const last = useRef<{ data: string; at: number } | null>(null);

  if (!permission) return <View style={[styles.fill, { backgroundColor: colors.background }]} />;

  if (!permission.granted) {
    return (
      <View style={[styles.fill, styles.center, { padding: 32, backgroundColor: colors.background }]}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
          <Camera size={34} color={colors.primary} />
        </View>
        <Text variant="h1" align="center" style={{ marginTop: 20 }}>
          {t("scan.permissionTitle")}
        </Text>
        <Text variant="body" color="textMuted" align="center" style={{ marginTop: 8, marginBottom: 24 }}>
          {t("scan.permissionText")}
        </Text>
        {permission.canAskAgain ? (
          <Button title={t("scan.allow")} onPress={requestPermission} />
        ) : (
          <Button title={t("scan.openSettings")} onPress={() => Linking.openSettings()} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={
          paused
            ? undefined
            : (r) => {
                const now = Date.now();
                if (last.current && last.current.data === r.data && now - last.current.at < 2000) return;
                last.current = { data: r.data, at: now };
                haptic.success();
                onScanned(r.data);
              }
        }
      />
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <View style={styles.frame}>
          {(["tl", "tr", "bl", "br"] as const).map((c) => (
            <View key={c} style={[styles.corner, styles[c], { borderColor: colors.primary }]} />
          ))}
        </View>
        <Text variant="bodyMedium" color="#fff" align="center" style={styles.hint}>
          {hint ?? t("scan.hint")}
        </Text>
      </View>
      <IconButton
        icon={torch ? <FlashlightOff size={22} color="#fff" /> : <Flashlight size={22} color="#fff" />}
        variant="overlay"
        accessibilityLabel={t("scan.torch")}
        onPress={() => setTorch((v) => !v)}
        style={styles.torch}
        size={52}
      />
    </View>
  );
}

const S = 240;
const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  iconCircle: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  frame: { width: S, height: S },
  corner: { position: "absolute", width: 44, height: 44, borderWidth: 5 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: radius.lg },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: radius.lg },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: radius.lg },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: radius.lg },
  hint: { marginTop: 28, paddingHorizontal: 32, textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 6 },
  torch: { position: "absolute", bottom: 40, alignSelf: "center" },
});
