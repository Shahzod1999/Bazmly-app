import React, { useState } from "react";
import { FlatList, RefreshControl, Switch, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTranslation } from "react-i18next";
import { Copy, UserPlus, Users } from "lucide-react-native";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Header,
  IconButton,
  Input,
  PhoneInput,
  Screen,
  Sheet,
  Skeleton,
  Text,
  errorMessage,
  toast,
} from "../../../components/ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useInviteStaff, useSetStaffActive, useStaff, useStaffRoles } from "../../../api/queries";
import type { StaffInvitationCreated } from "../../../api";
import { PartnerGate } from "../../../features/partner/PartnerGate";
import { usePartnerContext } from "../../../features/partner/usePartnerContext";
import { toE164 } from "../../../lib/format";

export default function PartnerStaff() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const ctx = usePartnerContext();
  const staff = useStaff(ctx.groupId);
  const roles = useStaffRoles();
  // Ro'yxat tanlangan filial bo'yicha: shu filial xodimlari + tarmoq darajasidagilar (venue_id = null).
  // Aks holda ikki filialda ishlaydigan odam ikki marta chiqadi.
  const list = (staff.data ?? []).filter((s) => s.venue_id == null || s.venue_id === ctx.venueId);
  const activeCount = list.filter((s) => s.is_active).length;
  const invite = useInviteStaff(ctx.groupId, ctx.venueId);
  const setActive = useSetStaffActive(ctx.venueId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", roleId: 0 });
  // Taklif orqali "Egasi" berilmaydi; filial lavozimlari birinchi
  const invitableRoles = (roles.data ?? [])
    .filter((r) => r.slug !== "owner")
    .sort((a, b) => Number(a.scope === "group") - Number(b.scope === "group") || a.sort_order - b.sort_order);
  const [created, setCreated] = useState<StaffInvitationCreated | null>(null);

  const submit = () =>
    invite.mutate(
      {
        full_name: form.name.trim(),
        phone: toE164(form.phone),
        staff_role_id: form.roleId,
        venue_id: ctx.venueId ?? null,
      },
      {
        onSuccess: (res) => {
          setOpen(false);
          setCreated(res);
        },
        onError: (e) => toast.error(errorMessage(e, t("common.errorGeneric"))),
      },
    );

  return (
    <Screen>
      <Header
        large
        title={t("tabs.staff")}
        subtitle={
          staff.data ? t("partner.staffCount", { active: activeCount, total: list.length }) : undefined
        }
        right={
          ctx.can("staff.manage") ? (
            <IconButton
              icon={<UserPlus size={22} color="#fff" />}
              variant="primary"
              accessibilityLabel={t("partner.invite")}
              onPress={() => {
                // Lavozim ataylab tanlanmagan: avval birinchi rol — "Egasi" — standart edi va
                // e'tiborsiz qolsa yangi xodim tarmoq egasi huquqini olardi
                setForm({ name: "", phone: "", roleId: 0 });
                setOpen(true);
              }}
            />
          ) : undefined
        }
      />
      <PartnerGate need="staff.manage">
        {() =>
          staff.isLoading ? (
            <Skeleton height={72} />
          ) : staff.isError ? (
            <ErrorState error={staff.error} onRetry={() => staff.refetch()} />
          ) : (
            <FlatList
              data={list}
              keyExtractor={(s) => String(s.id)}
              contentContainerStyle={{ gap: 10, paddingBottom: 24, flexGrow: 1 }}
              refreshControl={
                <RefreshControl
                  refreshing={staff.isRefetching}
                  onRefresh={() => void staff.refetch()}
                  tintColor={colors.primary}
                />
              }
              ListEmptyComponent={
                <EmptyState
                  icon={<Users size={30} color={colors.primary} />}
                  title={t("partner.staffEmpty")}
                />
              }
              renderItem={({ item }) => (
                <Card>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Avatar
                      uri={item.user.avatar_url}
                      firstName={item.user.first_name}
                      lastName={item.user.last_name}
                      size={44}
                    />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium">
                        {item.user.first_name} {item.user.last_name}
                      </Text>
                      <Text variant="small" color="textMuted">
                        {item.role_name}
                      </Text>
                    </View>
                    <Switch
                      value={item.is_active}
                      trackColor={{ true: colors.primary, false: colors.border }}
                      thumbColor="#fff"
                      accessibilityLabel={item.is_active ? t("partner.active") : t("partner.inactive")}
                      onValueChange={(v) =>
                        setActive.mutate(
                          { staffId: item.id, active: v },
                          { onError: (e) => toast.error(errorMessage(e, t("common.errorGeneric"))) },
                        )
                      }
                    />
                  </View>
                </Card>
              )}
            />
          )
        }
      </PartnerGate>

      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title={t("partner.invite")}
        scrollable
        footer={
          <Button
            title={t("partner.invite")}
            loading={invite.isPending}
            disabled={!form.name.trim() || form.phone.length !== 9 || !form.roleId}
            onPress={submit}
          />
        }
      >
        <View style={{ gap: 14 }}>
          <Input
            label={t("partner.inviteName")}
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            autoCapitalize="words"
          />
          <PhoneInput
            label={t("partner.invitePhone")}
            value={form.phone}
            onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
          />
          <Text variant="smallMedium" color="textMuted">
            {t("partner.inviteRole")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {invitableRoles.map((r) => (
              <Chip
                key={r.id}
                label={r.name}
                selected={form.roleId === r.id}
                onPress={() => setForm((f) => ({ ...f, roleId: r.id }))}
              />
            ))}
          </View>
        </View>
      </Sheet>

      <Sheet visible={!!created} onClose={() => setCreated(null)} title={t("partner.inviteCreated")}>
        {created ? (
          <View style={{ gap: 12 }}>
            <Card>
              <Text variant="bodyMedium" tabular>
                {t("partner.inviteCredentials", {
                  login: created.login,
                  password: created.temporary_password,
                })}
              </Text>
            </Card>
            <Button
              title={t("common.copy")}
              variant="soft"
              icon={<Copy size={18} color={colors.primary} />}
              onPress={async () => {
                await Clipboard.setStringAsync(`${created.login}\n${created.temporary_password}`);
                toast.success(t("common.copied"));
              }}
            />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
