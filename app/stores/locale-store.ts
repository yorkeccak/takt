import { create } from "zustand";

export type Locale = "en" | "de";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  initialize: () => void;
}

function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("locale");
  if (stored === "en" || stored === "de") return stored;
  return null;
}

function applyLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  document.documentElement.lang = locale;
  localStorage.setItem("locale", locale);
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: "en",

  initialize: () => {
    const stored = getStoredLocale();
    const locale = stored || "en";
    applyLocale(locale);
    set({ locale });
  },

  setLocale: (locale: Locale) => {
    applyLocale(locale);
    set({ locale });
  },

  toggleLocale: () => {
    const current = get().locale;
    const next = current === "en" ? "de" : "en";
    applyLocale(next);
    set({ locale: next });
  },
}));
