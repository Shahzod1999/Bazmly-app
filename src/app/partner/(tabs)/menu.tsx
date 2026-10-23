import React, { useState } from "react";
import { FlatList, RefreshControl, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Plus, UtensilsCrossed } from "lucide-react-native";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Header,
  IconButton,
  Input,
  Screen,
  Sheet,
  Skeleton,
  Text,
  errorMessage,
  toast,
} from "../../../components/ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { radius } from "../../../theme/tokens";
import { useCategories, useCreateCategory, useCreateMenuItem, useMenuItems } from "../../../api/queries";
import { PartnerGate } from "../../../features/partner/PartnerGate";
import { usePartnerContext } from "../../../features/partner/usePartnerContext";
import { foodImage } from "../../../features/venues/images";
import { formatMoney } from "../../../lib/format";

export default function PartnerMenu() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const ctx = usePartnerContext();
  const [catId, setCatId] = useState<number | undefined>(undefined);
  const categories = useCategories(ctx.groupId);
  const items = useMenuItems(ctx.venueId, catId);
  const createCat = useCreateCategory(ctx.groupId, ctx.venueId);
  const createItem = useCreateMenuItem(ctx.venueId);
  const [catOpen, setCatOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [item, setItem] = useState({ name: "", price: "", description: "", categoryId: 0 });

  const onError = (e: unknown) => toast.error(errorMessage(e, t("common.errorGeneric")));

  return (
    <Screen>
      <Header
        large
        title={t("tabs.menu")}
        subtitle={ctx.venue?.name}
        right={
          ctx.can("menu.edit") ? (
            <IconButton
              icon={<Plus size={22} color="#fff" />}
              variant="primary"
              accessibilityLabel={t("partner.addItem")}
              onPress={() => {
                setItem({
                  name: "",
                  price: "",
                  description: "",
                  categoryId: catId ?? categories.data?.[0]?.id ?? 0,
                });
                setItemOpen(true);
              }}
            />
          ) : undefined
        }
      />
      <PartnerGate need="menu.edit">
        {() => (
          <View style={{ flex: 1 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
              style={{ flexGrow: 0 }}
            >
              <Chip label={t("partner.all")} selected={!catId} onPress={() => setCatId(undefined)} />
              {(categories.data ?? []).map((c) => (
                <Chip
                  key={c.id}
                  label={`${c.name}${c.item_count !== undefined ? ` · ${c.item_count}` : ""}`}
                  selected={catId === c.id}
                  onPress={() => setCatId(c.id)}
                />
              ))}
              <Chip
                label={t("partner.addCategory")}
                icon={<Plus size={14} color={colors.primary} />}
                onPress={() => setCatOpen(true)}
              />
            </ScrollView>
            {items.isLoading ? (
              <Skeleton height={90} />
            ) : items.isError ? (
              <ErrorState error={items.error} onRetry={() => items.refetch()} />
            ) : (
              <FlatList
                data={items.data ?? []}
                keyExtractor={(m) => String(m.id)}
                contentContainerStyle={{ gap: 10, paddingBottom: 24, flexGrow: 1 }}
                refreshControl={
                  <RefreshControl
                    refreshing={items.isRefetching}
                    onRefresh={() => void items.refetch()}
                    tintColor={colors.primary}
                  />
                }
                ListEmptyComponent={
                  <EmptyState
                    icon={<UtensilsCrossed size={30} color={colors.primary} />}
                    title={t("partner.menuEmpty")}
                  />
                }
                renderItem={({ item: m }) => (
                  <Card>
                    <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                      <Image
                        source={foodImage(m.id, m.photo_url)}
                        style={{ width: 64, height: 64, borderRadius: radius.md }}
                        contentFit="cover"
                      />
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text variant="h3" numberOfLines={1}>
                          {m.name}
                        </Text>
                        <Text variant="bodyMedium" color="primary" tabular>
                          {m.effective_price
                            ? formatMoney(m.effective_price, m.currency)
                            : m.price_from
                              ? t("home.fromPrice", { price: formatMoney(m.price_from, m.currency) })
                              : "—"}
                        </Text>
                      </View>
                      <Badge
                        label={t(m.status === "active" ? "partner.active" : "partner.inactive")}
                        tone={m.status === "active" ? "success" : "neutral"}
                      />
                    </View>
                  </Card>
                )}
              />
            )}
          </View>
        )}
      </PartnerGate>

      <Sheet
        visible={catOpen}
        onClose={() => setCatOpen(false)}
        title={t("partner.addCategory")}
        footer={
          <Button
            title={t("common.save")}
            loading={createCat.isPending}
            disabled={!catName.trim()}
            onPress={() =>
              createCat.mutate(catName.trim(), {
                onSuccess: () => {
                  setCatName("");
                  setCatOpen(false);
                  toast.success(t("profile.saved"));
                },
                onError,
              })
            }
          />
        }
      >
        <Input label={t("partner.categoryName")} value={catName} onChangeText={setCatName} autoFocus />
      </Sheet>

      <Sheet
        visible={itemOpen}
        onClose={() => setItemOpen(false)}
        title={t("partner.addItem")}
        scrollable
        footer={
          <Button
            title={t("common.save")}
            loading={createItem.isPending}
            disabled={!item.name.trim() || !item.price || !item.categoryId}
            onPress={() =>
              createItem.mutate(
                {
                  menu_category_id: item.categoryId,
                  name: item.name.trim(),
                  base_price: Number(item.price.replace(/\D/g, "")),
                  description: item.description.trim() || null,
                  currency: "UZS",
                },
                {
                  onSuccess: () => {
                    setItemOpen(false);
                    toast.success(t("profile.saved"));
                  },
                  onError,
                },
              )
            }
          />
        }
      >
        <View style={{ gap: 14 }}>
          <Text variant="smallMedium" color="textMuted">
            {t("partner.menuCategories")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(categories.data ?? []).map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                selected={item.categoryId === c.id}
                onPress={() => setItem((s) => ({ ...s, categoryId: c.id }))}
              />
            ))}
          </View>
          <Input
            label={t("partner.itemName")}
            value={item.name}
            onChangeText={(v) => setItem((s) => ({ ...s, name: v }))}
          />
          <Input
            label={t("partner.itemPrice")}
            value={item.price}
            onChangeText={(v) => setItem((s) => ({ ...s, price: v.replace(/\D/g, "") }))}
            keyboardType="number-pad"
            right={
              <Text variant="small" color="textMuted">
                {t("currency.uzs")}
              </Text>
            }
          />
          <Input
            label={t("partner.itemDescription")}
            value={item.description}
            onChangeText={(v) => setItem((s) => ({ ...s, description: v }))}
            multiline
          />
        </View>
      </Sheet>
    </Screen>
  );
}
