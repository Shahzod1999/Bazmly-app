import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Store, UserCog } from "lucide-react-native";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { usePartnerContext } from "./usePartnerContext";
import { useAuth } from "../../stores/auth";
import { usePrefs } from "../../stores/prefs";

/** Guruh/filial yuklanmaguncha yoki yo'q bo'lsa — mos holatni ko'rsatadi */
export function PartnerGate({ children }: { children: (venueId: number) => React.ReactNode }) {
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
  // Xodim (venue_staff) tarmoq egasi emas: backend'da xodimning ish joyini qaytaradigan endpoint yo'q
  // (`/venue/groups/me` faqat egaga ishlaydi — BACKEND_CONTRACT §0). Muassasa yaratish taklif qilinmaydi.
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
  return <>{children(ctx.venueId)}</>;
}
