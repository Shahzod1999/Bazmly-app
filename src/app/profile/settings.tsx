import React, { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Switch, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { Check, Monitor, Moon, Sun } from "lucide-react-native";
import { Header, ListGroup, Screen, Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { SUPPORTED_LANGUAGES, changeLanguage } from "../../i18n";
import { usePrefs, type ThemePref } from "../../stores/prefs";
import { useAuth } from "../../stores/auth";
import { useLanguages } from "../../api/queries";
import { getPushPermissionStatus, requestPushPermission } from "../../lib/push";
import { haptic } from "../../lib/haptics";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { theme, setTheme } = usePrefs();
  const { status, updateProfile } = useAuth();
  const languages = useLanguages();
  const [push, setPush] = useState<"granted" | "denied" | "undetermined">("undetermined");

  useEffect(() => {
    void getPushPermissionStatus().then(setPush);
  }, []);

  const pickLanguage = (code: "uz" | "ru" | "en") => {
    haptic.selection();
    changeLanguage(code);
    const langId = languages.data?.find((l) => l.code === code)?.id;
    if (status === "authed" && langId) void updateProfile({ language_id: langId }).catch(() => {});
  };

  const pickTheme = (th: ThemePref) => {
    haptic.selection();
    setTheme(th);
    if (status === "authed") void updateProfile({ theme: th }).catch(() => {});
  };

  const themes: { value: ThemePref; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: t("profile.themeLight"), icon: <Sun size={22} color={colors.text} /> },
    { value: "dark", label: t("profile.themeDark"), icon: <Moon size={22} color={colors.text} /> },
    { value: "system", label: t("profile.themeSystem"), icon: <Monitor size={22} color={colors.text} /> },
  ];

  return (
    <Screen scroll>
      <Header title={t("tabs.settings")} />

      <Text variant="h2" style={styles.section}>
        {t("profile.language")}
      </Text>
      <ListGroup>
        {SUPPORTED_LANGUAGES.map((l) => (
          <Pressable
            key={l.code}
            onPress={() => pickLanguage(l.code)}
            style={styles.row}
            accessibilityRole="radio"
            accessibilityState={{ selected: i18n.language === l.code }}
          >
            <Image source={l.flag} style={styles.flag} />
            <Text variant="bodyMedium" style={{ flex: 1 }}>
              {l.native}
            </Text>
            {i18n.language === l.code ? <Check size={20} color={colors.primary} /> : null}
          </Pressable>
        ))}
      </ListGroup>

      <Text variant="h2" style={styles.section}>
        {t("profile.theme")}
      </Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {themes.map((th) => {
          const active = theme === th.value;
          return (
            <Pressable
              key={th.value}
              onPress={() => pickTheme(th.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[
                styles.theme,
                {
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySoft : colors.card,
                },
              ]}
            >
              {th.icon}
              <Text variant="smallMedium" style={{ marginTop: 8 }}>
                {th.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="h2" style={styles.section}>
        {t("profile.notificationsSettings")}
      </Text>
      <ListGroup>
        <View style={styles.row}>
          <Text variant="bodyMedium" style={{ flex: 1 }}>
            {t("profile.pushEnabled")}
          </Text>
          <Switch
            value={push === "granted"}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
            onValueChange={async (v) => {
              if (v && push === "undetermined") {
                const ok = await requestPushPermission();
                setPush(ok ? "granted" : "denied");
              } else {
                void Linking.openSettings();
              }
            }}
          />
        </View>
      </ListGroup>
      {push === "denied" ? (
        <Text variant="small" color="textMuted" style={{ marginTop: 8 }}>
          {t("profile.pushDisabledHint")}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, minHeight: 56 },
  flag: { width: 28, height: 28, borderRadius: 14 },
  theme: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: radius.lg, borderWidth: 1.5 },
});
