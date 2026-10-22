import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Avatar, Button, Header, Input, Screen, Text, errorMessage, toast } from "../../components/ui";
import { useAuth } from "../../stores/auth";
import { formatPhone } from "../../lib/format";

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [first, setFirst] = useState(user?.first_name ?? "");
  const [last, setLast] = useState(user?.last_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [loading, setLoading] = useState(false);
  const emailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const save = async () => {
    if (!first.trim() || !last.trim() || !emailValid) return;
    setLoading(true);
    try {
      await updateProfile({ first_name: first.trim(), last_name: last.trim(), email: email.trim() || null });
      toast.success(t("profile.saved"));
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
      footer={<Button title={t("common.save")} size="lg" loading={loading} onPress={save} />}
    >
      <Header title={t("profile.editProfile")} />
      <View style={{ alignItems: "center", marginVertical: 16 }}>
        <Avatar uri={user?.avatar_url} firstName={first} lastName={last} size={96} />
        <Text variant="small" color="textMuted" style={{ marginTop: 10 }}>
          {formatPhone(user?.phone)}
        </Text>
      </View>
      <View style={{ gap: 16 }}>
        <Input
          label={t("auth.firstName")}
          value={first}
          onChangeText={setFirst}
          autoCapitalize="words"
          error={!first.trim() ? t("errors.required") : null}
        />
        <Input
          label={t("auth.lastName")}
          value={last}
          onChangeText={setLast}
          autoCapitalize="words"
          error={!last.trim() ? t("errors.required") : null}
        />
        <Input
          label={`${t("profile.email")} (${t("common.optional")})`}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={!emailValid ? t("errors.required") : null}
        />
      </View>
    </Screen>
  );
}
