import React from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useTheme } from "../../theme/ThemeProvider";
import { darkMapStyle } from "./darkMapStyle";

export interface MapMarker {
  id: number;
  latitude: number;
  longitude: number;
  title?: string;
}

interface Props {
  latitude: number;
  longitude: number;
  delta?: number;
  markers: MapMarker[];
  selectedId?: number | null;
  onMarkerPress?: (id: number) => void;
  onPress?: () => void;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  showsUserLocation?: boolean;
}

/** Google Maps (iOS va Android'da PROVIDER_GOOGLE). Web uchun AppMap.web.tsx */
export function AppMap({
  latitude,
  longitude,
  delta = 0.05,
  markers,
  selectedId,
  onMarkerPress,
  onPress,
  interactive = true,
  style,
  showsUserLocation,
}: Props) {
  const { isDark, colors } = useTheme();
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={[StyleSheet.absoluteFill, style]}
      initialRegion={{ latitude, longitude, latitudeDelta: delta, longitudeDelta: delta }}
      customMapStyle={isDark ? darkMapStyle : []}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      showsUserLocation={showsUserLocation}
      onPress={onPress}
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          title={m.title}
          pinColor={m.id === selectedId ? colors.primaryPressed : colors.primary}
          onPress={() => onMarkerPress?.(m.id)}
        />
      ))}
    </MapView>
  );
}
