import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import uz from "./locales/uz.json";
import ru from "./locales/ru.json";
import en from "./locales/en.json";
import type { AppLanguage } from "../stores/prefs";
import { usePrefs } from "../stores/prefs";
import { setApiLanguage } from "../api/client";

export const SUPPORTED_LANGUAGES: { code: AppLanguage; native: string; flag: number }[] = [
  { code: "uz", native: "O'zbekcha", flag: require("../../assets/icons/uzb.png") },
  { code: "ru", native: "Русский", flag: require("../../assets/icons/ru.png") },
  { code: "en", native: "English", flag: require("../../assets/icons/eng.png") },
];

export function detectDeviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode;
  if (code === "ru") return "ru";
  if (code === "en") return "en";
  return "uz";
}

const initial = usePrefs.getState().language ?? detectDeviceLanguage();
setApiLanguage(initial);

// eslint-disable-next-line import/no-named-as-default-member -- i18n instansiyasi metodi (to'g'ri foydalanish)
void i18n.use(initReactI18next).init({
  resources: { uz: { translation: uz }, ru: { translation: ru }, en: { translation: en } },
  lng: initial,
  fallbackLng: "uz",
  interpolation: { escapeValue: false },
  returnObjects: true,
  react: { useSuspense: false },
});

export function changeLanguage(lang: AppLanguage) {
  usePrefs.getState().setLanguage(lang);
  setApiLanguage(lang);
  // eslint-disable-next-line import/no-named-as-default-member
  void i18n.changeLanguage(lang);
}

export default i18n;
