import React, { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, Header, Input, RatingStars, Screen, Text, errorMessage, toast } from "../../components/ui";
import { useCreateReview } from "../../api/queries";
import { BazmlyApiError } from "../../api/client";
import { usePrefs } from "../../stores/prefs";

export default function ReviewScreen() {
  const { bookingId, venue } = useLocalSearchParams<{ bookingId: string; venue?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const create = useCreateReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const markReviewed = usePrefs((s) => s.markReviewed);

  const submit = () =>
    create.mutate(
      { booking_id: Number(bookingId), rating, comment: comment.trim() || null },
      {
        onSuccess: () => {
          markReviewed(Number(bookingId));
          toast.success(t("review.thanks"));
          router.back();
        },
        onError: (e) => {
          if (e instanceof BazmlyApiError && e.code === "already_reviewed") {
            markReviewed(Number(bookingId));
            toast.info(t("review.already"));
            router.back();
            return;
          }
          toast.error(errorMessage(e, t("common.errorGeneric")));
        },
      },
    );

  return (
    <Screen
      keyboard
      scroll
      footer={<Button title={t("review.submit")} size="lg" loading={create.isPending} onPress={submit} />}
    >
      <Header title={t("review.title")} subtitle={venue} />
      <View style={{ alignItems: "center", marginVertical: 24, gap: 12 }}>
        <Text variant="h3">{t("review.ratingLabel")}</Text>
        <RatingStars value={rating} onChange={setRating} size={40} />
      </View>
      <Input
        placeholder={t("review.commentPlaceholder")}
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={1000}
      />
    </Screen>
  );
}
