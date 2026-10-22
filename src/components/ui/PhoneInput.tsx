import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { maskLocalPhone } from "../../lib/format";
import { Input, type InputProps } from "./Input";
import { Text } from "./Text";

interface PhoneInputProps extends Omit<InputProps, "value" | "onChangeText"> {
  /** Faqat 9 ta mahalliy raqam (operator kodi + raqam) */
  value: string;
  onChangeText: (digits: string) => void;
}

/** +998 prefiksli telefon kiritish: "90 123 45 67" */
export function PhoneInput({ value, onChangeText, ...rest }: PhoneInputProps) {
  const { colors } = useTheme();
  return (
    <Input
      keyboardType="phone-pad"
      textContentType="telephoneNumber"
      autoComplete="tel"
      maxLength={12}
      value={maskLocalPhone(value)}
      onChangeText={(t) => onChangeText(t.replace(/\D/g, "").slice(0, 9))}
      left={
        <View style={[styles.prefix, { borderRightColor: colors.border }]}>
          <Text variant="bodyMedium">🇺🇿 +998</Text>
        </View>
      }
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  prefix: { paddingRight: 10, borderRightWidth: 1, height: 24, justifyContent: "center" },
});
