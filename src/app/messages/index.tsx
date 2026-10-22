import React from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react-native";
import { Badge, Card, EmptyState, ErrorState, Header, Screen, Skeleton, Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useConversations } from "../../api/queries";
import { formatDateTime } from "../../lib/format";

export default function ConversationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const q = useConversations();
  return (
    <Screen>
      <Header title={t("profile.messages")} />
      {q.isLoading ? (
        <Skeleton height={72} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={[...(q.data ?? [])].sort((a, b) =>
            (b.last_message_at ?? "").localeCompare(a.last_message_at ?? ""),
          )}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ gap: 10, flexGrow: 1, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => void q.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={30} color={colors.primary} />}
              title={t("profile.messagesEmpty")}
            />
          }
          renderItem={({ item }) => (
            <Card
              onPress={() => router.push({ pathname: "/messages/[id]", params: { id: String(item.id) } })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text variant="h3">
                    {t("chat.venue")} #{item.venue_id}
                  </Text>
                  <Text variant="small" color="textMuted" numberOfLines={1} style={{ marginTop: 2 }}>
                    {item.last_message?.body ?? "—"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Text variant="caption" color="textSubtle">
                    {formatDateTime(item.last_message_at)}
                  </Text>
                  {item.unread_count ? (
                    <Badge label={String(item.unread_count)} tone="primary" solid />
                  ) : null}
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
