import React, { forwardRef, useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { fonts, radius } from "../../theme/tokens";
import { Text } from "./Text";
import { useFont } from "../../theme/fontFamily";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = forwardRef<TextInputInstance, InputProps>(function Input(
  { label, error, hint, left, right, containerStyle, style, multiline, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const fontFamily = useFont(fonts.medium);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="smallMedium" color="textMuted" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.surface,
            borderColor,
            minHeight: multiline ? 96 : 52,
            alignItems: multiline ? "flex-start" : "center",
          },
        ]}
      >
        {left}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          multiline={multiline}
          maxFontSizeMultiplier={1.4}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily,
              paddingTop: multiline ? 14 : 0,
              textAlignVertical: multiline ? "top" : "center",
            },
            style,
          ]}
          {...rest}
        />
        {right}
      </View>
      {error ? (
        <Text variant="small" color="danger" style={styles.helper}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" color="textSubtle" style={styles.helper}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  box: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    gap: 10,
  },
  // outlineWidth: web preview'dagi brauzer fokus ramkasini o'chiradi (native'ga ta'siri yo'q)
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    minHeight: 48,
    outlineWidth: 0,
    outlineStyle: "none",
  } as object,
  helper: { marginTop: 6 },
});
