import React from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react-native";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Header,
  Screen,
  Skeleton,
  Text,
} from "../../../components/ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useVenueConversations } from "../../../api/queries";
import type { ConversationListItem } from "../../../api";
import { usePartnerContext } from "../../../features/partner/usePartnerContext";
import { formatDateTime } from "../../../lib/format";

/** Hamkor: filialga mijozlar yozgan suhbatlar (`GET /venue/conversations`) */
export default function PartnerConversations() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const ctx = usePartnerContext();
  const q = useVenueConversations(ctx.venueId);
  const data = [...(q.data ?? [])].sort((a, b) =>
    (b.last_message_at ?? "").localeCompare(a.last_message_at ?? ""),
  );
  return (
    <Screen>
      <Header title={t("partner.messages")} subtitle={ctx.venue?.name} />
      {q.isLoading || ctx.isLoading ? (
        <View style={{ gap: 10 }}>
          <Skeleton height={72} />
          <Skeleton height={72} />
        </View>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={data}
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
              title={t("partner.messagesEmpty")}
              description={t("partner.messagesHint")}
            />
          }
          renderItem={({ item }) => <Row item={item} />}
        />
      )}
    </Screen>
  );
}

function Row({ item }: { item: ConversationListItem }) {
  const { t } = useTranslation();
  const router = useRouter();
  const name = item.user_name || t("partner.guest");
  const [first, ...rest] = name.split(" ");
  return (
    <Card
      onPress={() =>
        router.push({ pathname: "/partner/messages/[id]", params: { id: String(item.id), name } })
      }
      accessibilityLabel={name}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar firstName={first} lastName={rest.join(" ")} size={44} />
        <View style={{ flex: 1 }}>
          <Text variant="h3" numberOfLines={1}>
            {name}
          </Text>
          <Text
            variant="small"
            color={item.unread_count ? "text" : "textMuted"}
            numberOfLines={1}
            style={{ marginTop: 2 }}
          >
            {item.last_message?.sender_type === "venue" ? `${t("chat.you")}: ` : ""}
            {item.last_message?.body ?? "—"}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <Text variant="caption" color="textSubtle">
            {formatDateTime(item.last_message_at)}
          </Text>
          {item.unread_count ? <Badge label={String(item.unread_count)} tone="primary" solid /> : null}
        </View>
      </View>
    </Card>
  );
}
