import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Button, Header, PhoneInput, Screen, Text, errorMessage, toast } from "../../components/ui";
import { isValidUzPhone, toE164 } from "../../lib/format";
import { otpService } from "../../api";
import { MOCK_OTP } from "../../api/config.flags";

export default function PhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const valid = isValidUzPhone(phone);

  const submit = async () => {
    setTouched(true);
    if (!valid) return;
    setLoading(true);
    try {
      const e164 = toE164(phone);
      const res = await otpService.send(e164);
      router.push({
        pathname: "/(auth)/otp",
        params: {
          phone: e164,
          requestId: res.request_id,
          resendAfter: String(res.resend_after_seconds),
          length: String(res.code_length),
          redirect: redirect ?? "",
        },
      });
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
          title={t("auth.sendCode")}
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
      {MOCK_OTP ? (
        <Text variant="small" color="info" style={{ marginTop: 12 }}>
          {t("auth.otpMockHint", { code: "111111" })}
        </Text>
      ) : null}
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
        <Text variant="small" color="textSubtle">
          {t("auth.socialSoon")}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { width: 132, height: 33, marginTop: 8 },
  links: { marginTop: 28, gap: 14 },
});
