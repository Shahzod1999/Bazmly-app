import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, Header, OTPInput, Screen, Text, errorMessage, toast } from "../../components/ui";
import { formatPhone } from "../../lib/format";
import { BazmlyApiError, otpService } from "../../api";
import { MOCK_OTP, MOCK_OTP_CODE } from "../../api/config.flags";
import { useAuth } from "../../stores/auth";
import { finishAuth } from "../../features/auth/redirect";
import { haptic } from "../../lib/haptics";

export default function OtpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone: string;
    requestId: string;
    resendAfter?: string;
    length?: string;
    redirect?: string;
  }>();
  const length = Number(params.length) || 6;
  const verifyOtp = useAuth((s) => s.verifyOtp);
  const [requestId, setRequestId] = useState(params.requestId);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(Number(params.resendAfter) || 60);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const submit = async (value = code) => {
    if (value.length !== length || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await verifyOtp(requestId, params.phone, value);
      haptic.success();
      if (result === "needs_profile") {
        router.replace({ pathname: "/(auth)/name", params: { redirect: params.redirect ?? "" } });
      } else {
        finishAuth(params.redirect);
      }
    } catch (e) {
      haptic.error();
      setCode("");
      if (
        e instanceof BazmlyApiError &&
        ["otp_invalid", "otp_expired", "otp_attempts_exceeded"].includes(e.code)
      ) {
        setError(t(`auth.${e.code}`));
      } else {
        setError(errorMessage(e, t("common.errorGeneric")));
      }
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const res = await otpService.send(params.phone);
      setRequestId(res.request_id);
      setSeconds(res.resend_after_seconds);
      setError(null);
    } catch (e) {
      if (e instanceof BazmlyApiError && e.code === "otp_rate_limited") {
        const s = Number(e.details?.retry_after_seconds) || 60;
        setSeconds(s);
        toast.error(t("auth.otp_rate_limited", { seconds: s }));
      } else toast.error(errorMessage(e, t("common.errorGeneric")));
    }
  };

  return (
    <Screen
      keyboard
      scroll
      footer={
        <Button
          title={t("common.confirm")}
          size="lg"
          loading={loading}
          disabled={code.length !== length}
          onPress={() => submit()}
        />
      }
    >
      <Header back />
      <Text variant="display" style={{ marginTop: 8 }}>
        {t("auth.otpTitle")}
      </Text>
      <Text variant="body" color="textMuted" style={{ marginTop: 8, marginBottom: 32 }}>
        {t("auth.otpSubtitle", { phone: formatPhone(params.phone), length })}
      </Text>
      <OTPInput
        length={length}
        value={code}
        onChange={(v) => {
          setCode(v);
          if (error) setError(null);
        }}
        onComplete={(v) => submit(v)}
        error={!!error}
      />
      {error ? (
        <Text variant="smallMedium" color="danger" align="center" style={{ marginTop: 14 }}>
          {error}
        </Text>
      ) : null}
      {MOCK_OTP ? (
        <Text variant="small" color="info" align="center" style={{ marginTop: 14 }}>
          {t("auth.otpMockHint", { code: MOCK_OTP_CODE })}
        </Text>
      ) : null}
      <View style={{ alignItems: "center", marginTop: 28, gap: 16 }}>
        {seconds > 0 ? (
          <Text variant="smallMedium" color="textMuted" tabular>
            {t("auth.otpResendIn", { seconds })}
          </Text>
        ) : (
          <Pressable onPress={resend} hitSlop={10} accessibilityRole="button">
            <Text variant="smallMedium" color="primary">
              {t("auth.otpResend")}
            </Text>
          </Pressable>
        )}
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
          <Text variant="smallMedium" color="textMuted">
            {t("auth.otpWrongNumber")}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
