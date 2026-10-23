import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Lock, Store, UserCog } from "lucide-react-native";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { usePartnerContext, type Permission } from "./usePartnerContext";
import { useAuth } from "../../stores/auth";
import { usePrefs } from "../../stores/prefs";

/**
 * Guruh/filial yuklanmaguncha yoki yo'q bo'lsa — mos holatni ko'rsatadi.
 * `need` berilsa, rolida bu huquq bo'lmagan xodimga bo'lim yopiqligini aytadi.
 */
export function PartnerGate({
  children,
  need,
}: {
  children: (venueId: number) => React.ReactNode;
  need?: Permission;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const ctx = usePartnerContext();
  const role = useAuth((s) => s.user?.role);
  const setPartnerAsCustomer = usePrefs((s) => s.setPartnerAsCustomer);
  if (ctx.isLoading) {
    return (
      <View style={{ gap: 12 }}>
        <Skeleton height={140} radius={20} />
        <Skeleton height={220} radius={20} />
      </View>
    );
  }
  // Xodimning faol ish joyi yo'q (ishdan bo'shatilgan yoki eski backend). Muassasa yaratish taklif qilinmaydi.
  if (ctx.noGroup && role === "venue_staff") {
    return (
      <EmptyState
        icon={<UserCog size={30} color={colors.primary} />}
        title={t("partner.staffNoWorkplace")}
        description={t("partner.staffNoWorkplaceHint")}
        actionLabel={t("partner.openCustomer")}
        onAction={() => {
          setPartnerAsCustomer(true);
          router.replace("/");
        }}
      />
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
  if (need && !ctx.can(need)) {
    return (
      <EmptyState
        icon={<Lock size={30} color={colors.primary} />}
        title={t("partner.noAccess")}
        description={t("partner.noAccessHint", { role: ctx.role?.name ?? "" })}
      />
    );
  }
  return <>{children(ctx.venueId)}</>;
}
