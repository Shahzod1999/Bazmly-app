import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react-native";
import { Button, Header, Input, Screen, Text, errorMessage, toast } from "../../components/ui";
import { useAuth } from "../../stores/auth";
import { finishAuth } from "../../features/auth/redirect";
import { useTheme } from "../../theme/ThemeProvider";

export default function StaffLoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const loginStaff = useAuth((s) => s.loginStaff);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!login.trim() || !password) return;
    setLoading(true);
    try {
      await loginStaff(login.trim(), password);
      finishAuth(redirect);
    } catch (e) {
      toast.error(errorMessage(e, t("common.errorGeneric")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      keyboard
      scroll
      footer={
        <Button
          title={t("common.login")}
          size="lg"
          onPress={submit}
          loading={loading}
          disabled={!login.trim() || !password}
        />
      }
    >
      <Header back />
      <Text variant="display">{t("auth.staffTitle")}</Text>
      <Text variant="body" color="textMuted" style={{ marginTop: 8, marginBottom: 28 }}>
        {t("auth.staffSubtitle")}
      </Text>
      <View style={{ gap: 16 }}>
        <Input
          label={t("auth.login")}
          value={login}
          onChangeText={setLogin}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          autoComplete="username"
          autoFocus
        />
        <Input
          label={t("auth.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!show}
          textContentType="password"
          autoComplete="password"
          onSubmitEditing={submit}
          right={
            <Pressable
              onPress={() => setShow((v) => !v)}
              hitSlop={10}
              accessibilityLabel={t("auth.password")}
            >
              {show ? (
                <EyeOff size={20} color={colors.textMuted} />
              ) : (
                <Eye size={20} color={colors.textMuted} />
              )}
            </Pressable>
          }
        />
      </View>
      <Pressable onPress={() => router.push("/partner/register")} style={{ marginTop: 28 }} hitSlop={8}>
        <Text variant="smallMedium" color="primary">
          {t("auth.partnerLink")}
        </Text>
      </Pressable>
    </Screen>
  );
}
