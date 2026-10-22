import React, { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { CreditCard, Plus, Trash2 } from "lucide-react-native";
import {
  Button,
  EmptyState,
  ErrorState,
  Header,
  IconButton,
  Screen,
  Skeleton,
  confirmDialog,
  errorMessage,
  toast,
} from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useCards, useDeleteCard } from "../../api/queries";
import { AddCardSheet } from "../../features/payments/AddCardSheet";
import { CardTile } from "../../features/payments/CardTile";

export default function CardsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const cards = useCards();
  const del = useDeleteCard();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Screen
      scroll
      onRefresh={() => cards.refetch()}
      refreshing={cards.isRefetching}
      footer={
        <Button
          title={t("payment.addCard")}
          size="lg"
          icon={<Plus size={20} color="#fff" />}
          onPress={() => setAddOpen(true)}
        />
      }
    >
      <Header title={t("profile.myCards")} />
      {cards.isLoading ? (
        <View style={{ gap: 12 }}>
          <Skeleton height={68} />
          <Skeleton height={68} />
        </View>
      ) : cards.isError ? (
        <ErrorState error={cards.error} onRetry={() => cards.refetch()} />
      ) : !cards.data?.length ? (
        <EmptyState
          icon={<CreditCard size={30} color={colors.primary} />}
          title={t("payment.noCards")}
          description={t("payment.secure")}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {cards.data.map((c) => (
            <CardTile
              key={c.id}
              card={c}
              right={
                <IconButton
                  icon={<Trash2 size={18} color={colors.danger} />}
                  variant="plain"
                  accessibilityLabel={t("payment.removeCard")}
                  onPress={async () => {
                    const ok = await confirmDialog({
                      title: t("payment.removeCard"),
                      message: t("payment.removeCardConfirm", { card: c.masked_pan }),
                      confirmLabel: t("common.delete"),
                      destructive: true,
                    });
                    if (ok)
                      del.mutate(c.id, {
                        onError: (e) => toast.error(errorMessage(e, t("common.errorGeneric"))),
                      });
                  }}
                />
              }
            />
          ))}
        </View>
      )}
      <AddCardSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={() => toast.success(t("profile.saved"))}
      />
    </Screen>
  );
}
