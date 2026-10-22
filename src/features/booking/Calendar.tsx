import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { IconButton, Text } from "../../components/ui";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { mondayBasedWeekday, parseDateOnly, toDateOnly, weekdayShort } from "../../lib/format";
import { haptic } from "../../lib/haptics";

interface Props {
  value: string | null;
  onChange: (date: string) => void;
  /** Band (tanlab bo'lmaydigan) kunlar: YYYY-MM-DD */
  blocked?: Set<string>;
  minDate: Date;
  maxDate: Date;
  /** Ko'rsatilayotgan oy o'zgarganda (availability so'rash uchun) */
  onMonthChange?: (firstDay: Date) => void;
}

export function Calendar({ value, onChange, blocked, minDate, maxDate, onMonthChange }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const initial = value ? parseDateOnly(value) : minDate;
  const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const months = t("months", { returnObjects: true }) as unknown as string[];

  const days = useMemo(() => {
    const first = new Date(month);
    const offset = mondayBasedWeekday(first);
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= count; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [month]);

  const minKey = toDateOnly(minDate);
  const maxKey = toDateOnly(maxDate);
  const canPrev =
    new Date(month.getFullYear(), month.getMonth(), 0) >=
    new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= maxDate;

  const shift = (n: number) => {
    const m = new Date(month.getFullYear(), month.getMonth() + n, 1);
    setMonth(m);
    onMonthChange?.(m);
  };

  return (
    <View>
      <View style={styles.head}>
        <IconButton
          icon={<ChevronLeft size={20} color={colors.text} />}
          accessibilityLabel={t("a11y.prevMonth")}
          disabled={!canPrev}
          onPress={() => shift(-1)}
          size={40}
        />
        <Text variant="h3">
          {months[month.getMonth()]} {month.getFullYear()}
        </Text>
        <IconButton
          icon={<ChevronRight size={20} color={colors.text} />}
          accessibilityLabel={t("a11y.nextMonth")}
          disabled={!canNext}
          onPress={() => shift(1)}
          size={40}
        />
      </View>
      <View style={styles.row}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Text key={i} variant="caption" color="textSubtle" align="center" style={styles.cell}>
            {weekdayShort(i)}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((d, i) => {
          if (!d) return <View key={i} style={styles.cell} />;
          const k = toDateOnly(d);
          const disabled = k < minKey || k > maxKey || !!blocked?.has(k);
          const isBlocked = !!blocked?.has(k);
          const selected = value === k;
          return (
            <View key={i} style={styles.cell}>
              <Pressable
                disabled={disabled}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
                accessibilityLabel={k}
                onPress={() => {
                  haptic.selection();
                  onChange(k);
                }}
                style={[
                  styles.day,
                  selected && { backgroundColor: colors.primary },
                  isBlocked && { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  variant={selected ? "bodyMedium" : "body"}
                  color={selected ? colors.onPrimary : disabled ? colors.textSubtle : colors.text}
                  style={isBlocked ? { textDecorationLine: "line-through" } : undefined}
                >
                  {d.getDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  row: { flexDirection: "row" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 3 },
  day: { width: 42, height: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});
