import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { useTranslation } from "react-i18next";
import { BellRing } from "lucide-react-native";
import { Button, Sheet, Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { usePrefs } from "../../stores/prefs";
import { getPushPermissionStatus, requestPushPermission } from "../../lib/push";

/**
 * Push ruxsatini birinchi muvaffaqiyatli brondan keyin so'raydi (erta emas).
 * Avval o'z tushuntirish oynamiz, keyin tizim dialogi.
 */
export function PushPrompt() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const asked = usePrefs((s) => s.pushAsked);
  const setAsked = usePrefs((s) => s.setPushAsked);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (asked || Platform.OS === "web") return;
    let alive = true;
    void getPushPermissionStatus().then((s) => {
      if (alive && s === "undetermined") setTimeout(() => alive && setVisible(true), 1200);
      else if (s !== "undetermined") setAsked();
    });
    return () => {
      alive = false;
    };
  }, [asked, setAsked]);

  const close = () => {
    setAsked();
    setVisible(false);
  };

  return (
    <Sheet visible={visible} onClose={close}>
      <View style={{ alignItems: "center", paddingVertical: 12 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BellRing size={32} color={colors.primary} />
        </View>
        <Text variant="h1" align="center" style={{ marginTop: 16 }}>
          {t("notifications.permissionTitle")}
        </Text>
        <Text variant="body" color="textMuted" align="center" style={{ marginTop: 8 }}>
          {t("notifications.permissionText")}
        </Text>
      </View>
      <View style={{ gap: 10, marginTop: 12 }}>
        <Button
          title={t("notifications.enable")}
          onPress={async () => {
            close();
            await requestPushPermission();
          }}
        />
        <Button title={t("notifications.later")} variant="secondary" onPress={close} />
      </View>
    </Sheet>
  );
}
