import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Button, Header, PhoneInput, Screen, Text, errorMessage, toast } from "../../components/ui";
import { isValidUzPhone, toE164 } from "../../lib/format";
import { authService } from "../../api";
import { useAuth } from "../../stores/auth";
import { finishAuth } from "../../features/auth/redirect";

export default function PhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const valid = isValidUzPhone(phone);
  const loginPhone = useAuth((st) => st.loginPhone);

  const submit = async () => {
    setTouched(true);
    if (!valid) return;
    setLoading(true);
    try {
      const e164 = toE164(phone);
      // Backend'da SMS tasdiq yo'q: raqam ma'lum bo'lsa — kirish (parol o'rnatilgan bo'lsa so'raladi),
      // yangi bo'lsa — ro'yxatdan o'tish (DECISIONS.md Part 9)
      const check = await authService.checkPhone(e164);
      const params = { phone: e164, redirect: redirect ?? "" };
      if (!check.registered) {
        router.push({ pathname: "/(auth)/register", params });
      } else if (check.password_required) {
        router.push({ pathname: "/(auth)/password", params });
      } else {
        const res = await loginPhone(e164);
        if (res === "needs_profile") router.replace({ pathname: "/(auth)/name", params: { redirect: redirect ?? "" } });
        else finishAuth(redirect);
      }
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
          title={t("auth.continue")}
          size="lg"
          onPress={submit}
          loading={loading}
          disabled={phone.length < 9}
        />
      }
    >
      <Header back />
      <Image source={require("../../../assets/images/logo.png")} style={styles.logo} contentFit="contain" />
      <Text variant="display" style={{ marginTop: 24 }}>
        {t("auth.title")}
      </Text>
      <Text variant="body" color="textMuted" style={{ marginTop: 8, marginBottom: 28 }}>
        {t("auth.subtitle")}
      </Text>
      <PhoneInput
        label={t("auth.phoneLabel")}
        placeholder={t("auth.phonePlaceholder")}
        value={phone}
        onChangeText={setPhone}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={submit}
        error={touched && !valid ? t("auth.phoneInvalid") : null}
      />
      <Text variant="small" color="textSubtle" style={{ marginTop: 20 }}>
        {t("auth.terms")}
      </Text>
      <View style={styles.links}>
        <Pressable
          onPress={() =>
            router.push({ pathname: "/(auth)/staff-login", params: { redirect: redirect ?? "" } })
          }
          hitSlop={8}
        >
          <Text variant="smallMedium" color="primary">
            {t("auth.staffLink")}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { width: 132, height: 33, marginTop: 8 },
  links: { marginTop: 28, gap: 14 },
});
