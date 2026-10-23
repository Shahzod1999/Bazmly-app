import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ShieldAlert, ShieldCheck } from "lucide-react-native";
import { Button, Header, Input, Screen, Skeleton, Text, errorMessage, toast } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { authService } from "../../api";
import { useAuth } from "../../stores/auth";
import { MIN_PASSWORD } from "../../features/auth/constants";

/**
 * Parol o'rnatish yoki o'zgartirish (POST /auth/password).
 * Parol borligini `phone-check` aytadi (UserRead'da bunday maydon yo'q).
 */
export default function PasswordSettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const setPassword = useAuth((s) => s.setPassword);
  const check = useQuery({
    queryKey: ["password-status", user?.phone],
    queryFn: () => authService.checkPhone(user!.phone!),
    enabled: !!user?.phone,
  });
  const hasPassword = check.data?.password_required ?? false;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const tooShort = next.length < MIN_PASSWORD;
  const mismatch = repeat !== next;

  const submit = async () => {
    setTouched(true);
    if (tooShort || mismatch || (hasPassword && !current)) return;
    setLoading(true);
    try {
      await setPassword(next, hasPassword ? current : null);
      toast.success(t("profile.passwordSaved"));
      router.back();
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
      footer={<Button title={t("common.save")} size="lg" onPress={submit} loading={loading} disabled={check.isLoading} />}
    >
      <Header back title={t("profile.password")} />
      {check.isLoading ? (
        <Skeleton height={72} radius={16} style={{ marginTop: 8 }} />
      ) : (
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            padding: 14,
            borderRadius: radius.lg,
            backgroundColor: hasPassword ? colors.successSoft : colors.warningSoft,
            marginTop: 8,
          }}
        >
          {hasPassword ? (
            <ShieldCheck size={20} color={colors.success} />
          ) : (
            <ShieldAlert size={20} color={colors.warning} />
          )}
          <Text variant="small" style={{ flex: 1 }}>
            {hasPassword ? t("profile.passwordOn") : t("profile.passwordOff")}
          </Text>
        </View>
      )}
      <View style={{ gap: 16, marginTop: 20 }}>
        {hasPassword ? (
          <Input
            label={t("profile.currentPassword")}
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
            autoComplete="current-password"
            error={touched && !current ? t("profile.currentPasswordRequired") : null}
          />
        ) : null}
        <Input
          label={t("profile.newPassword")}
          value={next}
          onChangeText={setNext}
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
          autoComplete="new-password"
          hint={t("auth.passwordMin", { count: MIN_PASSWORD })}
          error={touched && tooShort ? t("auth.passwordTooShort", { count: MIN_PASSWORD }) : null}
        />
        <Input
          label={t("profile.repeatPassword")}
          value={repeat}
          onChangeText={setRepeat}
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={submit}
          error={touched && mismatch ? t("profile.passwordMismatch") : null}
        />
      </View>
    </Screen>
  );
}
