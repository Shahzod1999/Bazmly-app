import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Inbox, WifiOff } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { Text } from "./Text";
import { Button } from "./Button";
import { BazmlyApiError } from "../../api/client";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ title, description, icon, actionLabel, onAction, style }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
        {icon ?? <Inbox color={colors.primary} size={30} />}
      </View>
      <Text variant="h2" align="center">
        {title}
      </Text>
      {description ? (
        <Text variant="body" color="textMuted" align="center" style={styles.desc}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof BazmlyApiError) return error.message || fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

interface ErrorStateProps {
  error?: unknown;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ErrorState({ error, onRetry, style }: ErrorStateProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const offline = error instanceof BazmlyApiError && error.status === 0;
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.dangerSoft }]}>
        {offline ? (
          <WifiOff color={colors.danger} size={28} />
        ) : (
          <AlertTriangle color={colors.danger} size={28} />
        )}
      </View>
      <Text variant="h2" align="center">
        {offline ? t("common.offline") : t("common.errorTitle")}
      </Text>
      <Text variant="body" color="textMuted" align="center" style={styles.desc}>
        {errorMessage(error, t("common.errorGeneric"))}
      </Text>
      {onRetry ? (
        <Button
          title={t("common.retry")}
          variant="soft"
          onPress={onRetry}
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: 40, paddingHorizontal: 24 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  desc: { marginTop: 6, maxWidth: 320 },
  action: { marginTop: 20 },
});
