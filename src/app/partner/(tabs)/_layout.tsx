import React from "react";
import { Redirect, useRouter } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { useTranslation } from "react-i18next";
import {
  CalendarCheck,
  LayoutDashboard,
  QrCode,
  Settings,
  UtensilsCrossed,
  Users,
} from "lucide-react-native";
import { AppTabBar } from "../../../components/TabBar";
import { useAuth, isPartnerRole } from "../../../stores/auth";
import { useTheme } from "../../../theme/ThemeProvider";

export default function PartnerTabsLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const status = useAuth((s) => s.status);
  const role = useAuth((s) => s.user?.role);

  if (status !== "authed")
    return <Redirect href={{ pathname: "/(auth)/phone", params: { redirect: "/partner" } }} />;
  if (!isPartnerRole(role)) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      tabBar={(props) => (
        <AppTabBar
          {...props}
          items={[
            {
              name: "index",
              label: t("tabs.dashboard"),
              icon: ({ color }) => <LayoutDashboard size={24} color={color} />,
            },
            {
              name: "bookings",
              label: t("tabs.bookings"),
              icon: ({ color }) => <CalendarCheck size={24} color={color} />,
            },
            {
              name: "menu",
              label: t("tabs.menu"),
              icon: ({ color }) => <UtensilsCrossed size={24} color={color} />,
            },
            { name: "staff", label: t("tabs.staff"), icon: ({ color }) => <Users size={24} color={color} /> },
            {
              name: "settings",
              label: t("tabs.settings"),
              icon: ({ color }) => <Settings size={24} color={color} />,
            },
          ]}
          center={{
            label: t("tabs.checkIn"),
            icon: <QrCode size={26} color={colors.primary} />,
            onPress: () => router.push("/partner/scan"),
          }}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="menu" />
      <Tabs.Screen name="staff" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
