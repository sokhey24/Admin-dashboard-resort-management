import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const DEFAULT_LANG = "km";

function applyHtmlLang(lang) {
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute("lang", lang);
    if (lang === "km") {
      document.documentElement.classList.add("lang-km");
      document.documentElement.classList.remove("lang-en");
    } else {
      document.documentElement.classList.add("lang-en");
      document.documentElement.classList.remove("lang-km");
    }
  }
}

export const useLanguageStore = create()(
  persist(
    (set, get) => ({
      language: DEFAULT_LANG, // 'km' | 'en'

      setLanguage: (lang) => {
        const nextLang = lang === "en" ? "en" : "km";
        applyHtmlLang(nextLang);
        set({ language: nextLang });
      },

      toggleLanguage: () => {
        const current = get().language;
        const nextLang = current === "km" ? "en" : "km";
        applyHtmlLang(nextLang);
        set({ language: nextLang });
      },
    }),
    {
      name: "solara_admin_lang",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.language) {
          applyHtmlLang(state.language);
        } else {
          applyHtmlLang(DEFAULT_LANG);
        }
      },
    }
  )
);

// Initial bootstrap run
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("solara_admin_lang");
    if (saved) {
      const parsed = JSON.parse(saved);
      applyHtmlLang(parsed?.state?.language || DEFAULT_LANG);
    } else {
      applyHtmlLang(DEFAULT_LANG);
    }
  } catch {
    applyHtmlLang(DEFAULT_LANG);
  }
}
