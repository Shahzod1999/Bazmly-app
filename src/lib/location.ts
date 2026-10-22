import * as Location from "expo-location";
import { create } from "zustand";

interface Coords {
  latitude: number;
  longitude: number;
}

interface LocationState {
  coords: Coords | null;
  setCoords: (c: Coords | null) => void;
}

/** Oxirgi aniqlangan koordinata (masofa hisoblash uchun) — faqat sessiya davomida */
export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  setCoords: (coords) => set({ coords }),
}));

export type LocationResult = { ok: true; coords: Coords } | { ok: false; reason: "denied" | "error" };

/** Joylashuvni faqat kerak bo'lganda so'raydi ("when in use") */
export async function getCurrentLocation(): Promise<LocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return { ok: false, reason: "denied" };
    const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 }).catch(() => null);
    const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    useLocationStore.getState().setCoords(coords);
    return { ok: true, coords };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/** Ruxsat allaqachon berilgan bo'lsa jimgina koordinata oladi (dialog chiqarmaydi) */
export async function getLocationIfGranted(): Promise<Coords | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return null;
    const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 });
    if (!last) return null;
    const coords = { latitude: last.coords.latitude, longitude: last.coords.longitude };
    useLocationStore.getState().setCoords(coords);
    return coords;
  } catch {
    return null;
  }
}
