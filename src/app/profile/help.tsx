import React, { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Send } from "lucide-react-native";
import { Button, Card, Header, Screen, Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";

export default function HelpScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState<number | null>(0);
  const items = [1, 2, 3, 4];
  return (
    <Screen scroll>
      <Header title={t("profile.help")} />
      <View style={{ gap: 10 }}>
        {items.map((i) => {
          const isOpen = open === i;
          return (
            <Card key={i} padded={false}>
              <Pressable
                onPress={() => setOpen(isOpen ? null : i)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 10 }}
              >
                <Text variant="h3" style={{ flex: 1 }}>
                  {t(`faq.q${i}`)}
                </Text>
                {isOpen ? (
                  <ChevronUp size={18} color={colors.textMuted} />
                ) : (
                  <ChevronDown size={18} color={colors.textMuted} />
                )}
              </Pressable>
              {isOpen ? (
                <Text variant="body" color="textMuted" style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                  {t(`faq.a${i}`)}
                </Text>
              ) : null}
            </Card>
          );
        })}
      </View>
      <Text variant="body" color="textMuted" align="center" style={{ marginTop: 24 }}>
        {t("faq.contact")}
      </Text>
      <Button
        title={t("profile.support")}
        variant="soft"
        icon={<Send size={18} color={colors.primary} />}
        onPress={() => Linking.openURL("https://t.me/Bazmly_bot")}
        style={{ marginTop: 12 }}
      />
    </Screen>
  );
}
