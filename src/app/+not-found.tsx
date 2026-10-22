import React from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { EmptyState, Screen } from "../components/ui";

export default function NotFound() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Screen>
      <EmptyState
        title={t("venue.notFound")}
        actionLabel={t("payment.toHome")}
        onAction={() => router.replace("/")}
        style={{ flex: 1 }}
      />
    </Screen>
  );
}
