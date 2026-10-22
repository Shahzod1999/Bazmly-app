import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Store } from "lucide-react-native";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { usePartnerContext } from "./usePartnerContext";

/** Guruh/filial yuklanmaguncha yoki yo'q bo'lsa — mos holatni ko'rsatadi */
export function PartnerGate({ children }: { children: (venueId: number) => React.ReactNode }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const ctx = usePartnerContext();
  if (ctx.isLoading) {
    return (
      <View style={{ gap: 12 }}>
        <Skeleton height={140} radius={20} />
        <Skeleton height={220} radius={20} />
      </View>
    );
  }
  if (ctx.noGroup || (!ctx.error && !ctx.venueId)) {
    return (
      <EmptyState
        icon={<Store size={30} color={colors.primary} />}
        title={t("partner.noVenue")}
        description={t("partner.noVenueHint")}
        actionLabel={t("partner.addVenue")}
        onAction={() => router.push("/partner/register")}
      />
    );
  }
  if (ctx.error || !ctx.venueId) return <ErrorState error={ctx.error} onRetry={ctx.refetch} />;
  return <>{children(ctx.venueId)}</>;
}
