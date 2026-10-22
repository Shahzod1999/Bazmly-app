import React from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { MapPin } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { Text } from "../ui";
import type { MapMarker } from "./AppMap";

interface Props {
  latitude: number;
  longitude: number;
  markers: MapMarker[];
  selectedId?: number | null;
  onMarkerPress?: (id: number) => void;
  style?: StyleProp<ViewStyle>;
  [key: string]: unknown;
}

/**
 * Web preview uchun soddalashtirilgan xarita (react-native-maps web'ni qo'llamaydi).
 * Faqat dev preview — production ilova iOS/Android'da Google Maps ishlatadi.
 */
export function AppMap({ latitude, longitude, markers, selectedId, onMarkerPress, style }: Props) {
  const { colors } = useTheme();
  const span = 0.08;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }, style]}>
      <View style={[StyleSheet.absoluteFill, styles.grid]} />
      {markers.map((m) => {
        const x = 50 + ((m.longitude - longitude) / span) * 100;
        const y = 50 - ((m.latitude - latitude) / span) * 100;
        return (
          <Pressable
            key={m.id}
            onPress={() => onMarkerPress?.(m.id)}
            style={[
              styles.pin,
              { left: `${Math.min(92, Math.max(4, x))}%`, top: `${Math.min(88, Math.max(4, y))}%` },
            ]}
          >
            <MapPin
              size={m.id === selectedId ? 36 : 30}
              color={colors.primary}
              fill={m.id === selectedId ? colors.primary : colors.card}
            />
          </Pressable>
        );
      })}
      <View style={[styles.note, { backgroundColor: colors.card }]}>
        <Text variant="caption" color="textMuted">
          Google Maps (iOS / Android)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { opacity: 0.4 },
  pin: { position: "absolute", marginLeft: -15, marginTop: -30 },
  note: {
    position: "absolute",
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
