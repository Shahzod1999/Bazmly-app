/// <reference types="jest" />
/// <reference types="node" />
/* Jest uchun native modullar mock'lari */

// Reanimated 4 rasmiy mock'i native worklets runtime'ni talab qiladi — ilovada faqat
// Skeleton ishlatgan API qismini oddiy mock bilan almashtiramiz.
jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  const Animated = { View, createAnimatedComponent: (c: unknown) => c };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: (fn: () => object) => fn(),
    withTiming: (v: unknown) => v,
    withRepeat: (v: unknown) => v,
  };
});

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

// MMKV (Nitro) — xotiradagi ombor
jest.mock("react-native-mmkv", () => ({
  createMMKV: () => {
    const m = new Map<string, string>();
    return {
      getString: (k: string) => m.get(k),
      set: (k: string, v: string) => void m.set(k, v),
      remove: (k: string) => m.delete(k),
    };
  },
}));
