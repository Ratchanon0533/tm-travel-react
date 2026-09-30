import { createContext, useContext, useMemo } from "react";
import { languages, defaultLang } from "../config/site.js";

// Every src/i18n/<code>.json file is picked up automatically.
const dictionaries = Object.fromEntries(
  Object.entries(import.meta.glob("../i18n/*.json", { eager: true, import: "default" })).map(([path, dict]) => [
    path.match(/([\w-]+)\.json$/)[1],
    dict,
  ]),
);

export const langCodes = Object.keys(languages);

/** Plain (non-React) translation helpers for one language. */
export function createTranslator(lang) {
  const dict = dictionaries[lang] ?? {};
  const fallback = dictionaries[defaultLang] ?? {};
  return {
    lang,
    /** UI string by key, e.g. t("nav.seasons") */
    t: (key) => dict[key] ?? fallback[key] ?? key,
    /** Pick the current language from a multilingual object: { en, th, zh, ko } */
    tx: (obj) => (obj == null ? "" : obj[lang] ?? obj[defaultLang] ?? ""),
  };
}

const I18nContext = createContext(createTranslator(defaultLang));

export function I18nProvider({ lang, children }) {
  const value = useMemo(() => createTranslator(lang), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** const { lang, t, tx } = useI18n(); */
export const useI18n = () => useContext(I18nContext);
