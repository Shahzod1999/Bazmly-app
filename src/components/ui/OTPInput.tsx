import { useEffect, useRef } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputInstance } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { fonts, radius } from "../../theme/tokens";
import { Text } from "./Text";
import i18n from "../../i18n";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

/**
 * Bitta yashirin TextInput + ko'rinadigan katakchalar.
 * iOS: textContentType="oneTimeCode" (SMS'dan avtomatik taklif),
 * Android: autoComplete="sms-otp".
 */
export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  autoFocus = true,
}: OTPInputProps) {
  const { colors } = useTheme();
  const ref = useRef<TextInputInstance>(null);

  useEffect(() => {
    if (value.length === length) onComplete?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length]);

  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel={i18n.t("a11y.smsCode")}>
      <View style={styles.row}>
        {Array.from({ length }).map((_, i) => {
          const char = value[i] ?? "";
          const active = i === Math.min(value.length, length - 1);
          return (
            <View
              key={i}
              style={[
                styles.cell,
                {
                  backgroundColor: colors.surface,
                  borderColor: error ? colors.danger : active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text variant="h1" tabular>
                {char}
              </Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
        autoFocus={autoFocus}
        maxLength={length}
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, justifyContent: "center" },
  cell: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  hidden: { position: "absolute", opacity: 0.01, width: 1, height: 1, fontFamily: fonts.regular },
});
