import React, { useRef, useState } from "react";
import { View, type TextInputInstance } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, Header, Input, Screen, Text, errorMessage, toast } from "../../components/ui";
import { useAuth } from "../../stores/auth";
import { finishAuth } from "../../features/auth/redirect";

export default function NameScreen() {
  const { t } = useTranslation();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const completeProfile = useAuth((s) => s.completeProfile);
  const user = useAuth((s) => s.user);
  const [first, setFirst] = useState(user?.first_name ?? "");
  const [last, setLast] = useState(user?.last_name ?? "");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastRef = useRef<TextInputInstance>(null);

  const submit = async () => {
    setTouched(true);
    if (!first.trim() || !last.trim()) return;
    setLoading(true);
    try {
      await completeProfile(first.trim(), last.trim());
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
      footer={<Button title={t("auth.finish")} size="lg" onPress={submit} loading={loading} />}
    >
      <Header back={false} />
      <Text variant="display">{t("auth.nameTitle")}</Text>
      <Text variant="body" color="textMuted" style={{ marginTop: 8, marginBottom: 28 }}>
        {t("auth.nameSubtitle")}
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
          returnKeyType="done"
          onSubmitEditing={submit}
          error={touched && !last.trim() ? t("auth.lastNameRequired") : null}
        />
      </View>
    </Screen>
  );
}
