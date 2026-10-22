import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { Header } from "../../components/ui";

export function StepProgress({ step, total }: { step: number; total: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessibilityLabel={`${step + 1} / ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.bar, { backgroundColor: i <= step ? colors.primary : colors.border }]} />
      ))}
    </View>
  );
}

export function WizardHeader({
  title,
  subtitle,
  step,
  total,
  onBack,
}: {
  title: string;
  subtitle?: string;
  step: number;
  total: number;
  onBack: () => void;
}) {
  return (
    <View>
      <Header title={title} subtitle={subtitle} onBack={onBack} />
      <StepProgress step={step} total={total} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, marginTop: 4, marginBottom: 20 },
  bar: { flex: 1, height: 5, borderRadius: 3 },
});
