import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react-native";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  Screen,
  Skeleton,
  Text,
} from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useFriendRequests, useFriends, useRespondFriend } from "../../api/queries";

export default function FriendsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const friends = useFriends();
  const requests = useFriendRequests();
  const respond = useRespondFriend();
  const pending = (requests.data ?? []).filter((r) => r.status === "pending");

  return (
    <Screen
      scroll
      onRefresh={() => {
        void friends.refetch();
        void requests.refetch();
      }}
      refreshing={friends.isRefetching}
    >
      <Header title={t("profile.friends")} />
      {pending.length ? (
        <View style={{ gap: 10, marginBottom: 20 }}>
          <Text variant="h2">{t("profile.friendRequests")}</Text>
          {pending.map((r) => (
            <Card key={r.id}>
              <Text variant="bodyMedium">#{r.requester_id}</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <Button
                  title={t("profile.accept")}
                  size="sm"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  onPress={() => respond.mutate({ id: r.id, accept: true })}
                />
                <Button
                  title={t("profile.decline")}
                  size="sm"
                  variant="secondary"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  onPress={() => respond.mutate({ id: r.id, accept: false })}
                />
              </View>
            </Card>
          ))}
        </View>
      ) : null}
      {friends.isLoading ? (
        <Skeleton height={64} />
      ) : friends.isError ? (
        <ErrorState error={friends.error} onRetry={() => friends.refetch()} />
      ) : !friends.data?.length ? (
        <EmptyState icon={<Users size={30} color={colors.primary} />} title={t("profile.friendsEmpty")} />
      ) : (
        <View style={{ gap: 10 }}>
          {friends.data.map((f) => (
            <Card key={f.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Avatar uri={f.avatar_url} firstName={f.first_name} lastName={f.last_name} size={44} />
                <Text variant="bodyMedium">
                  {f.first_name} {f.last_name}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
