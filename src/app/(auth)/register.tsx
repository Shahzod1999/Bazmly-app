import React, { useRef, useState } from "react";
import { Pressable, View, type TextInputInstance } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, ShieldCheck } from "lucide-react-native";
import { Button, Header, Input, Screen, Text, errorMessage, toast } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { useAuth } from "../../stores/auth";
import { usePrefs } from "../../stores/prefs";
import { finishAuth } from "../../features/auth/redirect";
import { formatPhone } from "../../lib/format";
import { MIN_PASSWORD } from "../../features/auth/constants";


/**
 * Yangi raqam: ism, familiya va ixtiyoriy parol.
 * Backend SMS bilan tasdiqlamaydi — parolsiz akkauntga raqamni bilgan har kim kira oladi.
 * Shuning uchun parol tavsiya qilinadi, lekin majburiy emas (backend qarori).
 */
export default function RegisterScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { phone, redirect } = useLocalSearchParams<{ phone: string; redirect?: string }>();
  const register = useAuth((s) => s.register);
  const districtId = usePrefs((s) => s.districtId);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastRef = useRef<TextInputInstance>(null);
  const passRef = useRef<TextInputInstance>(null);

  const passwordInvalid = password.length > 0 && password.length < MIN_PASSWORD;

  const submit = async () => {
    setTouched(true);
    if (!first.trim() || !last.trim() || passwordInvalid) return;
    setLoading(true);
    try {
      await register({
        phone,
        first_name: first.trim(),
        last_name: last.trim(),
        password: password || null,
        district_id: districtId ?? null,
      });
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
      footer={<Button title={t("auth.createAccount")} size="lg" onPress={submit} loading={loading} />}
    >
      <Header back />
      <Text variant="display">{t("auth.registerTitle")}</Text>
      <Text variant="body" color="textMuted" style={{ marginTop: 8, marginBottom: 28 }}>
        {t("auth.registerSubtitle", { phone: formatPhone(phone) })}
      </Text>
      <View style={{ gap: 16 }}>
        <Input
          label={t("auth.firstName")}
          value={first}
          onChangeText={setFirst}
          autoFocus
          autoCapitalize="words"
          textContentType="givenName"
          autoComplete="name-given"
          returnKeyType="next"
          onSubmitEditing={() => lastRef.current?.focus()}
          error={touched && !first.trim() ? t("auth.firstNameRequired") : null}
        />
        <Input
          ref={lastRef}
          label={t("auth.lastName")}
          value={last}
          onChangeText={setLast}
          autoCapitalize="words"
          textContentType="familyName"
          autoComplete="name-family"
          returnKeyType="next"
          onSubmitEditing={() => passRef.current?.focus()}
          error={touched && !last.trim() ? t("auth.lastNameRequired") : null}
        />
        <Input
          ref={passRef}
          label={t("auth.passwordOptional")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          autoComplete="new-password"
          returnKeyType="done"
          onSubmitEditing={submit}
          hint={t("auth.passwordMin", { count: MIN_PASSWORD })}
          error={touched && passwordInvalid ? t("auth.passwordTooShort", { count: MIN_PASSWORD }) : null}
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
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            padding: 14,
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
          }}
        >
          <ShieldCheck size={20} color={colors.primary} />
          <Text variant="small" color="textMuted" style={{ flex: 1 }}>
            {t("auth.passwordWhy")}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
