import React from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { Text } from "./Text";
import { IconButton } from "./IconButton";
import i18n from "../../i18n";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  back?: boolean;
  onBack?: () => void;
  large?: boolean;
}

export function Header({ title, subtitle, right, back = true, onBack, large }: HeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };
  if (large) {
    return (
      <View style={styles.large}>
        <View style={styles.flex}>
          {title ? <Text variant="h1">{title}</Text> : null}
          {subtitle ? (
            <Text variant="small" color="textMuted" style={{ marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {back ? (
          <IconButton
            icon={<ChevronLeft size={22} color={colors.text} />}
            onPress={goBack}
            accessibilityLabel={i18n.t("common.back")}
          />
        ) : null}
      </View>
      <View style={styles.center}>
        {title ? (
          <Text variant="h3" numberOfLines={1} align="center">
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="caption" color="textMuted" numberOfLines={1} align="center">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, minHeight: 60 },
  side: { width: 88, flexDirection: "row" },
  right: { justifyContent: "flex-end", gap: 8 },
  center: { flex: 1, alignItems: "center" },
  large: { flexDirection: "row", alignItems: "center", paddingTop: 12, paddingBottom: 12, gap: 12 },
});
