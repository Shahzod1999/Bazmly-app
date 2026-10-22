import React from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react-native";
import { EmptyState, ErrorState, Header, IconButton, Screen, Skeleton, Text } from "../components/ui";
import { useTheme } from "../theme/ThemeProvider";
import { radius } from "../theme/tokens";
import { qk, useMarkAllRead, useNotifications } from "../api/queries";
import { engagementService, type NotificationRead } from "../api";
import { formatDateTime } from "../lib/format";
import { routeFromNotificationData } from "../lib/push";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const q = useNotifications();
  const markAll = useMarkAllRead();
  const items = (q.data?.pages ?? []).flatMap((p) => p.items);

  const open = (n: NotificationRead) => {
    if (!n.read_at) {
      void engagementService.markNotificationRead(n.id).then(() => {
        void qc.invalidateQueries({ queryKey: qk.notifications });
        void qc.invalidateQueries({ queryKey: qk.unread });
      });
    }
    const path = routeFromNotificationData({ type: n.type, ...(n.payload ?? {}) });
    if (path && path !== "/notifications") router.push(path as never);
  };

  return (
    <Screen>
      <Header
        title={t("notifications.title")}
        right={
          items.some((n) => !n.read_at) ? (
            <IconButton
              icon={<CheckCheck size={20} color={colors.primary} />}
              accessibilityLabel={t("notifications.markAllRead")}
              onPress={() => markAll.mutate()}
            />
          ) : undefined
        }
      />
      {q.isLoading ? (
        <View style={{ gap: 10 }}>
          <Skeleton height={76} />
          <Skeleton height={76} />
          <Skeleton height={76} />
        </View>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={{ gap: 10, paddingBottom: 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => void q.refetch()}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          ListFooterComponent={
            q.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : undefined
          }
          ListEmptyComponent={
            <EmptyState icon={<Bell size={30} color={colors.primary} />} title={t("notifications.empty")} />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => open(item)}
              accessibilityRole="button"
              style={[
                styles.item,
                {
                  backgroundColor: item.read_at ? colors.card : colors.primarySoft,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: colors.card }]}>
                <Bell size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{item.title}</Text>
                <Text variant="small" color="textMuted" style={{ marginTop: 2 }}>
                  {item.body}
                </Text>
                <Text variant="caption" color="textSubtle" style={{ marginTop: 6 }}>
                  {formatDateTime(item.sent_at)}
                </Text>
              </View>
              {!item.read_at ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: "row", gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
