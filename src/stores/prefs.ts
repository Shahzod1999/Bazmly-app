import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { zustandStorage } from "../lib/storage";

export type ThemePref = "light" | "dark" | "system";
export type AppLanguage = "uz" | "ru" | "en";

interface PrefsState {
  theme: ThemePref;
  language: AppLanguage | null; // null — hali tanlanmagan (onboarding)
  onboardingDone: boolean;
  districtId: number | null;
  districtLabel: string | null;
  pushAsked: boolean;
  /** Hamkor foydalanuvchi mijoz rejimiga o'tgan bo'lsa */
  partnerAsCustomer: boolean;
  setTheme: (t: ThemePref) => void;
  setLanguage: (l: AppLanguage) => void;
  completeOnboarding: () => void;
  setDistrict: (id: number | null, label: string | null) => void;
  setPushAsked: () => void;
  setPartnerAsCustomer: (v: boolean) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      theme: "system",
      language: null,
      onboardingDone: false,
      districtId: null,
      districtLabel: null,
      pushAsked: false,
      partnerAsCustomer: false,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      completeOnboarding: () => set({ onboardingDone: true }),
      setDistrict: (districtId, districtLabel) => set({ districtId, districtLabel }),
      setPushAsked: () => set({ pushAsked: true }),
      setPartnerAsCustomer: (partnerAsCustomer) => set({ partnerAsCustomer }),
    }),
    { name: "bazmly-prefs", storage: createJSONStorage(() => zustandStorage) },
  ),
);
