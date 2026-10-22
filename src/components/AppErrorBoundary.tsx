import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import type { ErrorBoundaryProps } from "expo-router";
import i18n from "../i18n";
import { Button, Text } from "./ui";
import { ThemeProvider } from "../theme/ThemeProvider";

/** expo-router global ErrorBoundary: ekran qulasa ilova to'liq yopilmaydi */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <ThemeProvider>
      <View style={styles.wrap}>
        <Text variant="h1" align="center">
          {i18n.t("common.errorTitle")}
        </Text>
        <Text variant="body" color="textMuted" align="center" style={{ marginTop: 8 }}>
          {i18n.t("common.errorGeneric")}
        </Text>
        {__DEV__ ? (
          <ScrollView style={styles.dev}>
            <Text variant="small" color="danger">
              {String(error?.stack || error?.message)}
            </Text>
          </ScrollView>
        ) : null}
        <Button title={i18n.t("common.retry")} onPress={retry} style={{ marginTop: 24 }} />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  dev: { maxHeight: 240, marginTop: 16 },
});
