import { useEffect } from "react";
import { Platform } from "react-native";
import * as Brightness from "expo-brightness";

/** QR ko'rsatilganda ekran yorqinligini maksimal qiladi, chiqqanda qaytaradi */
export function useMaxBrightness(enabled = true) {
  useEffect(() => {
    if (!enabled || Platform.OS === "web") return;
    let previous: number | null = null;
    let cancelled = false;
    (async () => {
      try {
        // setBrightnessAsync faqat joriy oyna yorqinligini o'zgartiradi — ruxsat talab qilinmaydi
        previous = await Brightness.getBrightnessAsync();
        if (!cancelled) await Brightness.setBrightnessAsync(1);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
      if (previous !== null) void Brightness.setBrightnessAsync(previous).catch(() => {});
    };
  }, [enabled]);
}
