import React, { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { errorMessage, toast } from "../../../components/ui";
import { useSendVenueMessage, useVenueConversations, useVenueMessages } from "../../../api/queries";
import { engagementService } from "../../../api";
import { usePartnerContext } from "../../../features/partner/usePartnerContext";
import { ChatView } from "../../../features/chat/ChatView";

/** Hamkor: mijozga javob — xabar muassasa nomidan ketadi (`sender_type=venue`) */
export default function PartnerChat() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const cid = Number(id);
  const { t } = useTranslation();
  const qc = useQueryClient();
  const ctx = usePartnerContext();
  const q = useVenueMessages(cid, ctx.venueId);
  const send = useSendVenueMessage(cid, ctx.venueId);
  // Push orqali ochilganda ism parametrda bo'lmaydi
  const convs = useVenueConversations(name ? undefined : ctx.venueId);
  const title = name || convs.data?.find((c) => c.id === cid)?.user_name || t("partner.guest");

  useEffect(() => {
    if (!cid || !ctx.venueId) return;
    engagementService
      .markVenueConversationRead(cid, ctx.venueId)
      .then(() => qc.invalidateQueries({ queryKey: ["venue-conversations"] }))
      .catch(() => {});
  }, [cid, ctx.venueId, q.data?.length, qc]);

  return (
    <ChatView
      title={title}
      subtitle={ctx.venue?.name}
      q={q}
      isMine={(m) => m.sender_type === "venue"}
      sending={send.isPending}
      onSend={(body) =>
        send
          .mutateAsync(body)
          .then(() => true)
          .catch((e) => {
            toast.error(errorMessage(e, t("common.errorGeneric")));
            return false;
          })
      }
    />
  );
}
