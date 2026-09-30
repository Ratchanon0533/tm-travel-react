/**
 * Global site settings — company details, languages, behaviour.
 * Edit here; every component reads from this file.
 */
export const site = {
  /** Production URL — used for canonical / hreflang links. Change before deploying. */
  url: "https://example.com",

  name: "TM Travel",
  legalName: "TM Travel Co., Ltd.",
  legalNameJa: "株式会社TMトラベル",
  taglineJa: "旅で 人を つなぐ",

  phone: "+81 89-989-5578",
  phoneHref: "tel:+81899895578",
  address: ["1-8-46 Misawa, Matsuyama,", "Ehime 791-8022, Japan"],
  japaneseSiteUrl: "https://tm-travel.co.jp/",

  logo: {
    color: "images/logo/tm-travel-logo.png",
    white: "images/logo/tm-travel-logo-white.png",
    width: 564,
    height: 75,
  },

  /** Hero slideshow: milliseconds per slide */
  heroIntervalMs: 7000,

  /**
   * Photo source:
   *  "unsplash" – load from the Unsplash CDN (default)
   *  "local"    – load from /public/images/photos/<key>.jpg  (run `npm run images:download` first)
   */
  imageSource: "unsplash",
};

/**
 * Languages. The first one is the default and lives at "/"; the others at "/<code>/".
 * To add a language: add it here, create src/i18n/<code>.json, and add the
 * translations to the files in src/data/. The prerender step builds a page for each.
 */
export const languages = {
  en: { label: "English", htmlLang: "en", fonts: null },
  ja: {
    label: "日本語",
    htmlLang: "ja",
    fonts: "family=Noto+Sans+JP:wght@400;500;700",
  },
  th: {
    label: "ไทย",
    htmlLang: "th",
    fonts: "family=Noto+Sans+Thai:wght@400;500;600;700&family=Noto+Serif+Thai:wght@500;600;700",
  },
  zh: {
    label: "简体中文",
    htmlLang: "zh-Hans",
    fonts: "family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@500;700",
  },
  ko: {
    label: "한국어",
    htmlLang: "ko",
    fonts: "family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@500;700",
  },
};

export const defaultLang = "en";

/** Main navigation — `key` is the i18n label, `href` the section id */
export const navigation = [
  { key: "nav.destinations", href: "#destinations" },
  { key: "nav.seasons", href: "#seasons" },
  { key: "nav.experiences", href: "#experiences" },
  { key: "nav.about", href: "#about" },
  { key: "nav.contact", href: "#contact" },
];
