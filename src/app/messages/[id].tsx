import React, { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { errorMessage, toast } from "../../components/ui";
import { useConversations, useMessages, useSendMessage, useVenue } from "../../api/queries";
import { engagementService } from "../../api";
import { useAuth } from "../../stores/auth";
import { ChatView } from "../../features/chat/ChatView";

export default function ChatScreen() {
  const { id, venue } = useLocalSearchParams<{ id: string; venue?: string }>();
  const cid = Number(id);
  const { t } = useTranslation();
  const me = useAuth((s) => s.user?.id);
  const q = useMessages(cid);
  const send = useSendMessage(cid);
  // Bildirishnoma yoki deep link orqali ochilganda nom parametrda bo'lmaydi
  const convs = useConversations();
  const conv = convs.data?.find((c) => c.id === cid);
  const venueQ = useVenue(venue || conv?.venue_name ? 0 : (conv?.venue_id ?? 0));
  const title = venue || conv?.venue_name || venueQ.data?.venue.name || t("chat.venue");

  useEffect(() => {
    if (cid) void engagementService.markConversationRead(cid).catch(() => {});
  }, [cid, q.data?.length]);

  return (
    <ChatView
      title={title}
      q={q}
      isMine={(m) => m.sender_type === "user" && m.sender_user_id === me}
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
