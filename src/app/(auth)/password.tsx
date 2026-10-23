import React, { useState } from "react";
import { Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react-native";
import { Button, Header, Input, Screen, Text, errorMessage } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useAuth } from "../../stores/auth";
import { finishAuth } from "../../features/auth/redirect";
import { formatPhone } from "../../lib/format";

/** Ro'yxatdan o'tgan, paroli bor raqam uchun parol kiritish */
export default function PasswordScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { phone, redirect } = useLocalSearchParams<{ phone: string; redirect?: string }>();
  const loginPhone = useAuth((s) => s.loginPhone);
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await loginPhone(phone, password);
      if (res === "needs_profile") router.replace({ pathname: "/(auth)/name", params: { redirect: redirect ?? "" } });
      else finishAuth(redirect);
    } catch (e) {
      setError(errorMessage(e, t("common.errorGeneric")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      keyboard
      scroll
      footer={<Button title={t("auth.signIn")} size="lg" onPress={submit} loading={loading} disabled={!password} />}
    >
      <Header back />
      <Text variant="display">{t("auth.passwordTitle")}</Text>
      <Text variant="body" color="textMuted" style={{ marginTop: 8, marginBottom: 28 }}>
        {t("auth.passwordSubtitle", { phone: formatPhone(phone) })}
      </Text>
      <Input
        label={t("auth.password")}
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          setError(null);
        }}
        secureTextEntry={!visible}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={error}
        right={
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t(visible ? "auth.hidePassword" : "auth.showPassword")}
          >
            {visible ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
          </Pressable>
        }
      />
    </Screen>
  );
}
