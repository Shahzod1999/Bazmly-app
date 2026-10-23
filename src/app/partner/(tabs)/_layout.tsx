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
import { AppTabBar, type TabItem } from "../../../components/TabBar";
import { usePartnerContext, type Permission } from "../../../features/partner/usePartnerContext";
import { useAuth, useIsPartner } from "../../../stores/auth";
import { useTheme } from "../../../theme/ThemeProvider";

export default function PartnerTabsLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const status = useAuth((s) => s.status);
  const partner = useIsPartner();
  const ctx = usePartnerContext();

  if (status !== "authed")
    return <Redirect href={{ pathname: "/(auth)/phone", params: { redirect: "/partner" } }} />;
  if (!partner) return <Redirect href="/" />;

  // Huquqlar yuklanmaguncha hamma bo'limlar ko'rinadi; har bir ekran o'zi ham tekshiradi (PartnerGate)
  const allowed = (p: Permission) => ctx.isLoading || ctx.can(p);
  const NEEDS: Record<string, Permission | undefined> = {
    menu: "menu.edit",
    staff: "staff.manage",
    settings: undefined,
  };
  const all: TabItem[] = [
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
  ];
  const visible = all.filter((i) => !NEEDS[i.name] || allowed(NEEDS[i.name]!));

  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      tabBar={(props) => (
        <AppTabBar
          {...props}
          items={visible}
          center={
            allowed("bookings.confirm")
              ? {
                  label: t("tabs.checkIn"),
                  icon: <QrCode size={26} color={colors.primary} />,
                  onPress: () => router.push("/partner/scan"),
                }
              : null
          }
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
