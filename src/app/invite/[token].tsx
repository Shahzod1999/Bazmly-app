import React, { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, Header, Input, PhoneInput, Screen, Text, errorMessage, toast } from "../../components/ui";
import { partnerService } from "../../api";
import { toE164 } from "../../lib/format";

/**
 * Xodim taklifnomasini qabul qilish (deep link: bazmly.uz/invite/<login>).
 * POST /venue/staff/invitations/accept — vaqtinchalik parolni yangisiga almashtiradi.
 */
export default function InviteAccept() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [login, setLogin] = useState(token ?? "");
  const [temp, setTemp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const valid = phone.length === 9 && login.trim() && temp && password.length >= 6;

  const submit = async () => {
    if (!valid) return;
    setLoading(true);
    try {
      await partnerService.acceptInvitation(toE164(phone), {
        login: login.trim(),
        temporary_password: temp,
        new_password: password,
      });
      toast.success(t("profile.saved"));
      router.replace("/(auth)/staff-login");
    } catch (e) {
      toast.error(errorMessage(e, t("common.errorGeneric")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      scroll
      keyboard
      footer={
        <Button
          title={t("partner.inviteAccept")}
          size="lg"
          loading={loading}
          disabled={!valid}
          onPress={submit}
        />
      }
    >
      <Header title={t("partner.inviteAccept")} />
      <Text variant="body" color="textMuted" style={{ marginBottom: 20 }}>
        {t("auth.staffSubtitle")}
      </Text>
      <View style={{ gap: 14 }}>
        <PhoneInput label={t("auth.phoneLabel")} value={phone} onChangeText={setPhone} />
        <Input label={t("auth.login")} value={login} onChangeText={setLogin} autoCapitalize="none" />
        <Input label={t("partner.tempPassword")} value={temp} onChangeText={setTemp} secureTextEntry />
        <Input
          label={t("partner.newPassword")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
        />
      </View>
    </Screen>
  );
}
