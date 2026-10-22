import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { useTranslation } from "react-i18next";
import * as ScreenCapture from "expo-screen-capture";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react-native";
import { Button, Input, OTPInput, Sheet, Text, errorMessage, toast } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { paymentService, type SavedCard } from "../../api";
import { qk } from "../../api/queries";
import { MOCK_PAYMENTS } from "../../api/config.flags";
import { detectCardBrand, formatCardNumber, formatExpiry, isExpiryValid, isLuhnValid } from "../../lib/card";

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdded: (card: SavedCard) => void;
}

/**
 * Karta qo'shish: raqam + muddat → SMS kod → SavedCard.
 * Karta raqami faqat shu komponent state'ida yashaydi va hech qayerga saqlanmaydi.
 * Sheet ochiq turganda skrinshot bloklanadi (Android FLAG_SECURE / iOS).
 */
export function AddCardSheet({ visible, onClose, onAdded }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [phase, setPhase] = useState<"form" | "otp">("form");
  const [requestId, setRequestId] = useState("");
  const [phoneMask, setPhoneMask] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  // Yopilganda forma tozalanadi (karta raqami xotirada qolmasin)
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (!visible) {
      setNumber("");
      setExpiry("");
      setPhase("form");
      setCode("");
      setTouched(false);
    }
  }

  useEffect(() => {
    if (!visible || Platform.OS === "web") return;
    void ScreenCapture.preventScreenCaptureAsync("add-card").catch(() => {});
    return () => {
      void ScreenCapture.allowScreenCaptureAsync("add-card").catch(() => {});
    };
  }, [visible]);

  const digits = number.replace(/\D/g, "");
  const brand = detectCardBrand(digits);
  const numberError =
    touched && digits.length > 0
      ? digits.length < 16 || !isLuhnValid(digits)
        ? t("payment.cardInvalid")
        : !brand
          ? t("payment.cardUnsupported")
          : null
      : null;
  const expiryError =
    touched && expiry.length === 5 && !isExpiryValid(expiry) ? t("payment.cardExpired") : null;
  const valid = digits.length === 16 && isLuhnValid(digits) && !!brand && isExpiryValid(expiry);

  const submitCard = async () => {
    setTouched(true);
    if (!valid) return;
    setLoading(true);
    try {
      const res = await paymentService.addCard(digits, expiry);
      setRequestId(res.card_request_id);
      setPhoneMask(res.phone_mask);
      setPhase("otp");
    } catch (e) {
      toast.error(errorMessage(e, t("common.errorGeneric")));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    try {
      const card = await paymentService.verifyCard(requestId, value);
      void qc.invalidateQueries({ queryKey: qk.cards });
      onAdded(card);
      onClose();
    } catch (e) {
      setCode("");
      toast.error(errorMessage(e, t("common.errorGeneric")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={phase === "form" ? t("payment.addCard") : t("payment.cardOtpTitle")}
      subtitle={phase === "otp" ? t("payment.cardOtpSubtitle", { phone: phoneMask }) : t("payment.cards")}
      footer={
        phase === "form" ? (
          <Button
            title={t("common.continue")}
            size="lg"
            loading={loading}
            disabled={digits.length < 16 || expiry.length < 5}
            onPress={submitCard}
          />
        ) : (
          <Button
            title={t("common.confirm")}
            size="lg"
            loading={loading}
            disabled={code.length !== 6}
            onPress={() => verify()}
          />
        )
      }
    >
      {phase === "form" ? (
        <View style={{ gap: 14, paddingBottom: 8 }}>
          <Input
            label={t("payment.cardNumber")}
            placeholder="8600 0000 0000 0000"
            value={formatCardNumber(number)}
            onChangeText={setNumber}
            keyboardType="number-pad"
            textContentType="creditCardNumber"
            autoComplete="cc-number"
            maxLength={19}
            left={<CreditCard size={20} color={colors.textSubtle} />}
            right={
              brand ? (
                <Text variant="caption" color="primary">
                  {brand === "uzcard" ? "UZCARD" : "HUMO"}
                </Text>
              ) : null
            }
            error={numberError}
            autoFocus
          />
          <Input
            label={t("payment.expiry")}
            placeholder={t("payment.expiryPlaceholder")}
            value={expiry}
            onChangeText={(v) => setExpiry(formatExpiry(v))}
            keyboardType="number-pad"
            autoComplete="cc-exp"
            maxLength={5}
            error={expiryError}
            containerStyle={{ width: 160 }}
          />
          <Text variant="small" color="textSubtle">
            {t("payment.secure")}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 16, paddingVertical: 8 }}>
          <OTPInput value={code} onChange={setCode} onComplete={(v) => verify(v)} />
          {MOCK_PAYMENTS ? (
            <Text variant="small" color="info" align="center">
              {t("auth.otpMockHint", { code: "111111" })}
            </Text>
          ) : null}
        </View>
      )}
    </Sheet>
  );
}
