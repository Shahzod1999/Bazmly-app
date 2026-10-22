import React, { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { IconButton, Text } from "../../components/ui";
import { radius } from "../../theme/tokens";
import i18n from "../../i18n";

type Src = number | { uri: string };

/** Swipe qilinadigan rasm galereyasi + to'liq ekran ko'rish */
export function Gallery({ images, height }: { images: Src[]; height: number }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState<number | null>(null);

  return (
    <View style={{ height }}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index: i }) => (
          <Pressable onPress={() => setFull(i)} accessibilityRole="imagebutton">
            <Image source={item} style={{ width, height }} contentFit="cover" transition={200} />
          </Pressable>
        )}
      />
      {images.length > 1 ? (
        <View style={styles.counter}>
          <Text variant="caption" color="#fff">
            {index + 1} / {images.length}
          </Text>
        </View>
      ) : null}
      <Modal
        visible={full !== null}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setFull(null)}
      >
        <View style={styles.fullWrap}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            initialScrollIndex={full ?? 0}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <Image source={item} style={{ width, height: "100%" }} contentFit="contain" />
            )}
          />
          <IconButton
            icon={<X size={22} color="#fff" />}
            variant="overlay"
            accessibilityLabel={i18n.t("common.close")}
            onPress={() => setFull(null)}
            style={[styles.close, { top: insets.top + 10 }]}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    position: "absolute",
    bottom: 36,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  fullWrap: { flex: 1, backgroundColor: "#000" },
  close: { position: "absolute", right: 16 },
});
