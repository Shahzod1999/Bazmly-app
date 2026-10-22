import React, { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react-native";
import {
  EmptyState,
  ErrorState,
  Header,
  IconButton,
  Skeleton,
  Text,
  errorMessage,
  toast,
} from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { fonts, radius } from "../../theme/tokens";
import { useMessages, useSendMessage } from "../../api/queries";
import { engagementService } from "../../api";
import { useAuth } from "../../stores/auth";
import { useFont } from "../../theme/fontFamily";

export default function ChatScreen() {
  const { id, venue } = useLocalSearchParams<{ id: string; venue?: string }>();
  const cid = Number(id);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useAuth((s) => s.user?.id);
  const q = useMessages(cid);
  const send = useSendMessage(cid);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);
  const inputFont = useFont(fonts.regular);

  useEffect(() => {
    if (cid) void engagementService.markConversationRead(cid).catch(() => {});
  }, [cid, q.data?.length]);

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    send.mutate(body, {
      onError: (e) => {
        setText(body);
        toast.error(errorMessage(e, t("common.errorGeneric")));
      },
    });
  };

  const messages = [...(q.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20 }}>
        <Header title={venue || t("chat.venue")} subtitle={t("chat.online")} />
      </View>
      {q.isLoading ? (
        <View style={{ padding: 20, gap: 10 }}>
          <Skeleton height={44} width="60%" />
          <Skeleton height={44} width="50%" style={{ alignSelf: "flex-end" }} />
        </View>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          ref={listRef}
          inverted={messages.length > 0}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 20, gap: 8, flexGrow: 1 }}
          ListEmptyComponent={<EmptyState title={t("chat.empty")} />}
          renderItem={({ item }) => {
            const mine = item.sender_type === "user" && item.sender_user_id === me;
            return (
              <View
                style={[
                  styles.bubble,
                  mine
                    ? { alignSelf: "flex-end", backgroundColor: colors.primary, borderBottomRightRadius: 6 }
                    : { alignSelf: "flex-start", backgroundColor: colors.surface, borderBottomLeftRadius: 6 },
                ]}
              >
                <Text variant="body" color={mine ? colors.onPrimary : colors.text}>
                  {item.body}
                </Text>
                <Text
                  variant="caption"
                  color={mine ? "rgba(255,255,255,0.75)" : colors.textSubtle}
                  align="right"
                  style={{ marginTop: 2 }}
                >
                  {new Date(item.created_at).toTimeString().slice(0, 5)}
                </Text>
              </View>
            );
          }}
        />
      )}
      <View
        style={[
          styles.composer,
          {
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 10),
            backgroundColor: colors.background,
          },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t("chat.placeholder")}
          placeholderTextColor={colors.textSubtle}
          multiline
          maxLength={2000}
          style={[
            styles.input,
            { backgroundColor: colors.surface, color: colors.text, fontFamily: inputFont },
          ]}
        />
        <IconButton
          icon={<Send size={20} color="#fff" />}
          variant="primary"
          accessibilityLabel={t("chat.send")}
          onPress={submit}
          disabled={!text.trim() || send.isPending}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: "80%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
});
