import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Application from "expo-application";
import {
  Bell,
  Bookmark,
  Briefcase,
  CreditCard,
  Globe,
  HelpCircle,
  History,
  LogOut,
  MessageCircle,
  Moon,
  Store,
  Trash2,
  UserPen,
  Users,
} from "lucide-react-native";
import {
  Avatar,
  Button,
  Card,
  ListGroup,
  ListRow,
  Screen,
  Text,
  confirmDialog,
  errorMessage,
  toast,
} from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useAuth, isPartnerRole } from "../../stores/auth";
import { usePrefs } from "../../stores/prefs";
import { SUPPORTED_LANGUAGES } from "../../i18n";
import { formatPhone } from "../../lib/format";
import { requireAuth } from "../../features/auth/redirect";
import { unregisterPushToken } from "../../lib/push";
import { queryClient } from "../../api/queries";

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { user, status, logout, deleteAccount } = useAuth();
  const theme = usePrefs((s) => s.theme);
  const setPartnerAsCustomer = usePrefs((s) => s.setPartnerAsCustomer);
  const authed = status === "authed";
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language);
  const icon = (I: typeof Bell, danger = false) => (
    <I size={20} color={danger ? colors.danger : colors.text} />
  );
  const go = (path: string) => () => (requireAuth(path) ? router.push(path as never) : undefined);

  const doLogout = async () => {
    if (
      !(await confirmDialog({
        title: t("profile.logoutConfirm"),
        confirmLabel: t("profile.logout"),
        destructive: true,
      }))
    )
      return;
    await unregisterPushToken();
    await logout();
    queryClient.clear();
  };

  const doDelete = async () => {
    const ok = await confirmDialog({
      title: t("profile.deleteAccountConfirm"),
      message: t("profile.deleteAccountText"),
      confirmLabel: t("profile.deleteAccount"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteAccount();
      queryClient.clear();
      toast.success(t("profile.deleted"));
    } catch (e) {
      toast.error(errorMessage(e, t("common.errorGeneric")));
    }
  };

  return (
    <Screen scroll>
      <Text variant="h1" style={{ paddingTop: 12, marginBottom: 16 }}>
        {t("profile.title")}
      </Text>

      {authed && user ? (
        <Card onPress={() => router.push("/profile/edit")} accessibilityLabel={t("profile.editProfile")}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Avatar uri={user.avatar_url} firstName={user.first_name} lastName={user.last_name} size={64} />
            <View style={{ flex: 1 }}>
              <Text variant="h2" numberOfLines={1}>
                {user.first_name} {user.last_name}
              </Text>
              <Text variant="small" color="textMuted">
                {formatPhone(user.phone)}
              </Text>
            </View>
            <UserPen size={20} color={colors.primary} />
          </View>
        </Card>
      ) : (
        <Card>
          <Text variant="h2">{t("profile.guestTitle")}</Text>
          <Text variant="body" color="textMuted" style={{ marginTop: 6, marginBottom: 16 }}>
            {t("profile.guestText")}
          </Text>
          <Button title={t("common.login")} onPress={() => requireAuth("/profile")} />
        </Card>
      )}

      {authed && isPartnerRole(user?.role) ? (
        <View style={{ marginTop: 16 }}>
          <ListGroup>
            <ListRow
              icon={<Briefcase size={20} color={colors.primary} />}
              title={t("profile.switchToPartner")}
              onPress={() => {
                setPartnerAsCustomer(false);
                router.replace("/partner");
              }}
            />
          </ListGroup>
        </View>
      ) : null}

      <View style={{ marginTop: 16 }}>
        <ListGroup>
          <ListRow icon={icon(CreditCard)} title={t("profile.myCards")} onPress={go("/profile/cards")} />
          <ListRow icon={icon(Bookmark)} title={t("profile.favorites")} onPress={go("/profile/favorites")} />
          <ListRow icon={icon(MessageCircle)} title={t("profile.messages")} onPress={go("/messages")} />
          <ListRow icon={icon(Bell)} title={t("profile.notifications")} onPress={go("/notifications")} />
          <ListRow
            icon={icon(History)}
            title={t("profile.history")}
            onPress={() => router.navigate("/places")}
          />
          <ListRow icon={icon(Users)} title={t("profile.friends")} onPress={go("/profile/friends")} />
        </ListGroup>
      </View>

      <View style={{ marginTop: 16 }}>
        <ListGroup>
          <ListRow
            icon={icon(Globe)}
            title={t("profile.language")}
            right={
              <Text variant="small" color="textMuted">
                {lang?.native}
              </Text>
            }
            onPress={() => router.push("/profile/settings")}
          />
          <ListRow
            icon={icon(Moon)}
            title={t("profile.theme")}
            right={
              <Text variant="small" color="textMuted">
                {t(
                  theme === "dark"
                    ? "profile.themeDark"
                    : theme === "light"
                      ? "profile.themeLight"
                      : "profile.themeSystem",
                )}
              </Text>
            }
            onPress={() => router.push("/profile/settings")}
          />
          <ListRow
            icon={icon(HelpCircle)}
            title={t("profile.help")}
            onPress={() => router.push("/profile/help")}
          />
          {!isPartnerRole(user?.role) ? (
            <ListRow icon={icon(Store)} title={t("auth.partnerLink")} onPress={go("/partner/register")} />
          ) : null}
        </ListGroup>
      </View>

      {authed ? (
        <View style={{ marginTop: 16 }}>
          <ListGroup>
            <ListRow icon={icon(LogOut, true)} title={t("profile.logout")} danger onPress={doLogout} />
            <ListRow icon={icon(Trash2, true)} title={t("profile.deleteAccount")} danger onPress={doDelete} />
          </ListGroup>
        </View>
      ) : null}

      <Text variant="caption" color="textSubtle" align="center" style={{ marginTop: 24 }}>
        {t("profile.version", { version: Application.nativeApplicationVersion ?? "1.0.0" })}
      </Text>
    </Screen>
  );
}
