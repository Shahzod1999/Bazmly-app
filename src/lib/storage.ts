import { Platform } from "react-native";
import type { StateStorage } from "zustand/middleware";

/**
 * Oddiy (maxfiy bo'lmagan) sozlamalar uchun kalit-qiymat ombori.
 * Native: react-native-mmkv. Web preview: localStorage.
 * Tokenlar BU YERDA saqlanmaydi — ular uchun src/api/tokens.ts (SecureStore).
 */
interface KV {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
}

function createKV(): KV {
  if (Platform.OS !== "web") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createMMKV } = require("react-native-mmkv");
      const mmkv = createMMKV({ id: "bazmly-prefs" });
      return {
        getString: (k) => mmkv.getString(k),
        set: (k, v) => mmkv.set(k, v),
        remove: (k) => mmkv.remove(k),
      };
    } catch (e) {
      if (__DEV__) console.warn("MMKV ishga tushmadi, xotiradagi omborga o'tildi", e);
    }
  }
  const mem = new Map<string, string>();
  return {
    getString: (k) => {
      try {
        const v = globalThis.localStorage?.getItem(k);
        if (v !== null && v !== undefined) return v;
      } catch {
        /* ignore */
      }
      return mem.get(k);
    },
    set: (k, v) => {
      mem.set(k, v);
      try {
        globalThis.localStorage?.setItem(k, v);
      } catch {
        /* ignore */
      }
    },
    remove: (k) => {
      mem.delete(k);
      try {
        globalThis.localStorage?.removeItem(k);
      } catch {
        /* ignore */
      }
    },
  };
}

export const kv = createKV();

/** zustand/persist uchun adapter */
export const zustandStorage: StateStorage = {
  getItem: (name) => kv.getString(name) ?? null,
  setItem: (name, value) => kv.set(name, value),
  removeItem: (name) => kv.remove(name),
};
