import React, { useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "../../theme/ThemeProvider";
import { MAX_CONTENT_WIDTH, radius } from "../../theme/tokens";
import { PROMO_BANNERS } from "./images";

/** "Eng yaxshi takliflar" — avtomatik aylanadigan banner (3.5 s) */
export function PromoCarousel() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const itemW = Math.min(width, MAX_CONTENT_WIDTH) - 40;
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);
  const userInteracted = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (userInteracted.current) return;
      setIndex((i) => {
        const next = (i + 1) % PROMO_BANNERS.length;
        ref.current?.scrollToOffset({ offset: next * (itemW + 12), animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(id);
  }, [itemW]);

  return (
    <View>
      <FlatList
        ref={ref}
        data={PROMO_BANNERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemW + 12}
        decelerationRate="fast"
        keyExtractor={(_, i) => String(i)}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        onScrollBeginDrag={() => (userInteracted.current = true)}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (itemW + 12)))}
        renderItem={({ item }) => (
          <Image
            source={item}
            style={[styles.banner, { width: itemW }]}
            contentFit="cover"
            transition={150}
          />
        )}
      />
      <View style={styles.dots}>
        {PROMO_BANNERS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { width: i === index ? 20 : 6, backgroundColor: i === index ? colors.primary : colors.border },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { aspectRatio: 2, borderRadius: radius.xl },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
  dot: { height: 6, borderRadius: 3 },
});
