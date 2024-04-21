import { create } from "zustand";

type I18nStore = {
    currentLanguage: string;
    setCurrentLanguage: (language: string) => void;
    translations: Record<string, string>;
    setTranslations: (translations: Record<string, string>) => void;
    t: (key: string) => string;
};

export const useI18nStore = create<I18nStore>((set, get) => ({
    currentLanguage: "",
    setCurrentLanguage: (language: string) => set({ currentLanguage: language }),
    translations: {},
    setTranslations: (translations: Record<string, string>) => set({ translations }),
    t: (key: string) => get().translations[key] || key,
}));
