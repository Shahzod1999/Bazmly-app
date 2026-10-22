import React from "react";
import { Text as RNText, type TextProps, type TextStyle } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { typography, type TypographyVariant, ThemeColors } from "../../theme/tokens";
import { useFont } from "../../theme/fontFamily";

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: keyof ThemeColors | (string & {});
  align?: TextStyle["textAlign"];
  tabular?: boolean;
}

export function Text({ variant = "body", color = "text", align, tabular, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const resolved = (colors as unknown as Record<string, string>)[color] ?? color;
  const fontFamily = useFont(typography[variant].fontFamily);
  return (
    <RNText
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[
        typography[variant],
        { color: resolved, fontFamily },
        align ? { textAlign: align } : null,
        tabular ? { fontVariant: ["tabular-nums"] } : null,
        style,
      ]}
    />
  );
}
