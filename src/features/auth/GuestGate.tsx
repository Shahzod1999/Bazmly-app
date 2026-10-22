import React from "react";
import { useTranslation } from "react-i18next";
import { LogIn } from "lucide-react-native";
import { EmptyState } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { requireAuth } from "./redirect";

/** Mehmon uchun "tizimga kiring" holati */
export function GuestGate({ redirect, title }: { redirect: string; title?: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <EmptyState
      icon={<LogIn size={30} color={colors.primary} />}
      title={title ?? t("profile.guestTitle")}
      description={t("profile.guestText")}
      actionLabel={t("common.login")}
      onAction={() => requireAuth(redirect)}
    />
  );
}
