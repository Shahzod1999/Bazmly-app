import React from "react";
import { Redirect, useRouter } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { useTranslation } from "react-i18next";
import { Home, Ticket, ReceiptText, UserRound } from "lucide-react-native";
import { AppTabBar } from "../../components/TabBar";
import { useIsPartner } from "../../stores/auth";
import { usePrefs } from "../../stores/prefs";
import { useTheme } from "../../theme/ThemeProvider";

export default function CustomerTabsLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const partner = useIsPartner();
  const partnerAsCustomer = usePrefs((s) => s.partnerAsCustomer);

  // Hamkor foydalanuvchi o'z paneliga yo'naltiriladi (mijoz rejimini tanlamagan bo'lsa)
  if (partner && !partnerAsCustomer) return <Redirect href="/partner" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      tabBar={(props) => (
        <AppTabBar
          {...props}
          items={[
            { name: "index", label: t("tabs.home"), icon: ({ color }) => <Home size={24} color={color} /> },
            {
              name: "vouchers",
              label: t("tabs.vouchers"),
              icon: ({ color }) => <Ticket size={24} color={color} />,
            },
            {
              name: "places",
              label: t("tabs.places"),
              icon: ({ color }) => <ReceiptText size={24} color={color} />,
            },
            {
              name: "profile",
              label: t("tabs.profile"),
              icon: ({ color }) => <UserRound size={24} color={color} />,
            },
          ]}
          center={{ label: t("tabs.scan"), onPress: () => router.push("/scan") }}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="vouchers" />
      <Tabs.Screen name="places" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
