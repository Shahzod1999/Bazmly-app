import React, { useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react-native";
import { Button, Text } from "../components/ui";
import { useTheme } from "../theme/ThemeProvider";
import { radius } from "../theme/tokens";
import { SUPPORTED_LANGUAGES, changeLanguage, detectDeviceLanguage } from "../i18n";
import { usePrefs, type AppLanguage } from "../stores/prefs";
import { haptic } from "../lib/haptics";

const SLIDES = [
  { key: "1", image: require("../../assets/images/home/tuyxona3.jpg") },
  { key: "2", image: require("../../assets/images/home/top.jpg") },
  { key: "3", image: require("../../assets/images/home/rest2.jpg") },
];

export default function Onboarding() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const completeOnboarding = usePrefs((s) => s.completeOnboarding);
  const complete = () => {
    completeOnboarding();
    router.replace("/");
  };
  const [lang, setLang] = useState<AppLanguage>(usePrefs.getState().language ?? detectDeviceLanguage());
  const [phase, setPhase] = useState<"language" | "slides">("language");
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  if (phase === "language") {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: insets.top + 40 }]}>
        <View style={styles.langWrap}>
          <Image source={require("../../assets/images/logo.png")} style={styles.logo} contentFit="contain" />
          <Text variant="display" style={{ marginTop: 32 }}>
            {t("onboarding.chooseLanguage")}
          </Text>
          <Text variant="body" color="textMuted" style={{ marginTop: 6, marginBottom: 28 }}>
            {t("onboarding.chooseLanguageHint")}
          </Text>
          <View style={{ gap: 12 }}>
            {SUPPORTED_LANGUAGES.map((l) => {
              const active = l.code === lang;
              return (
                <Pressable
                  key={l.code}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    haptic.selection();
                    setLang(l.code);
                    changeLanguage(l.code);
                  }}
                  style={[
                    styles.langRow,
                    {
                      backgroundColor: active ? colors.primarySoft : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Image source={l.flag} style={styles.flag} />
                  <Text variant="h3" style={styles.flex}>
                    {l.native}
                  </Text>
                  {active ? (
                    <View style={[styles.check, { backgroundColor: colors.primary }]}>
                      <Check size={16} color="#fff" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
          <Button
            title={t("common.continue")}
            size="lg"
            onPress={() => {
              changeLanguage(lang);
              setPhase("slides");
            }}
          />
        </View>
      </View>
    );
  }

  const last = index === SLIDES.length - 1;
  const goNext = () => {
    if (last) {
      complete();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View style={[styles.flex, { backgroundColor: "#000" }]}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.key}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width, height }}>
            <Image source={item.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            <LinearGradient
              colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.88)"]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}
      />
      <Pressable
        onPress={complete}
        style={[styles.skip, { top: insets.top + 12 }]}
        accessibilityRole="button"
        hitSlop={10}
      >
        <Text variant="smallMedium" color="#fff">
          {t("onboarding.skip")}
        </Text>
      </Pressable>
      <View style={[styles.slideText, { paddingBottom: insets.bottom + 24 }]} pointerEvents="box-none">
        <Text variant="display" color="#fff">
          {t(`onboarding.slide${index + 1}Title`)}
        </Text>
        <Text variant="body" color="rgba(255,255,255,0.85)" style={{ marginTop: 10 }}>
          {t(`onboarding.slide${index + 1}Text`)}
        </Text>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.dot,
                {
                  width: i === index ? 24 : 8,
                  backgroundColor: i === index ? colors.primary : "rgba(255,255,255,0.5)",
                },
              ]}
            />
          ))}
        </View>
        <Button title={last ? t("onboarding.start") : t("common.next")} size="lg" onPress={goNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  langWrap: { flex: 1, paddingHorizontal: 24, width: "100%", maxWidth: 560, alignSelf: "center" },
  logo: { width: 150, height: 37 },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    height: 64,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  flag: { width: 32, height: 32, borderRadius: 16 },
  check: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  bottom: { paddingHorizontal: 24, width: "100%", maxWidth: 560, alignSelf: "center" },
  skip: {
    position: "absolute",
    right: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  slideText: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    maxWidth: 560,
    alignSelf: "center",
    width: "100%",
  },
  dots: { flexDirection: "row", gap: 6, marginVertical: 24 },
  dot: { height: 8, borderRadius: 4 },
});
