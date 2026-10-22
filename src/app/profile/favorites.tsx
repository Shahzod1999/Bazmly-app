import React from "react";
import { FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Bookmark } from "lucide-react-native";
import { EmptyState, ErrorState, Header, Screen, Skeleton } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useFavorites } from "../../api/queries";
import { VenueCard } from "../../features/venues/VenueCard";

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const q = useFavorites();
  return (
    <Screen>
      <Header title={t("profile.favorites")} />
      {q.isLoading ? (
        <Skeleton height={96} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(f) => String(f.id)}
          contentContainerStyle={{ gap: 12, paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState
              icon={<Bookmark size={30} color={colors.primary} />}
              title={t("profile.favoritesEmpty")}
            />
          }
          renderItem={({ item }) => (
            <VenueCard
              venue={item.venue}
              variant="row"
              onPress={() => router.push({ pathname: "/venue/[id]", params: { id: String(item.venue.id) } })}
            />
          )}
        />
      )}
    </Screen>
  );
}
