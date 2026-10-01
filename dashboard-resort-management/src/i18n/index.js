import { en } from "./en";
import { km } from "./km";
import { useLanguageStore } from "../store/useLanguageStore";

export const dictionaries = { en, km };

/**
 * Access nested dictionary value with dot notation like 'nav.dashboard'
 */
export function getTranslation(lang, path, fallback = "") {
  const dict = dictionaries[lang] || dictionaries.km;
  if (!path) return fallback;

  const parts = path.split(".");
  let current = dict;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      // fallback to English if missing in Khmer
      let fallbackCurrent = dictionaries.en;
      for (const fPart of parts) {
        if (fallbackCurrent && typeof fallbackCurrent === "object" && fPart in fallbackCurrent) {
          fallbackCurrent = fallbackCurrent[fPart];
        } else {
          return fallback || path;
        }
      }
      return typeof fallbackCurrent === "string" ? fallbackCurrent : fallback || path;
    }
  }

  return typeof current === "string" ? current : fallback || path;
}

/**
 * React Hook for seamless reactive bilingual translations
 */
export function useTranslation() {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const toggleLanguage = useLanguageStore((s) => s.toggleLanguage);

  const t = (path, fallback = "") => getTranslation(language, path, fallback);

  return {
    t,
    language,
    isKhmer: language === "km",
    setLanguage,
    toggleLanguage,
    dict: dictionaries[language] || dictionaries.km,
  };
}

/**
 * Format system status strings (e.g., 'checked_in') into bilingual labels
 */
export function formatStatusLabel(status, language = "km") {
  if (!status) return "";
  const key = String(status).toLowerCase();
  const dict = dictionaries[language]?.status || dictionaries.km.status;
  return dict[key] || String(status).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default useTranslation;
