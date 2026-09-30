/**
 * <head> tags per language (title, description, canonical, hreflang, Open Graph, fonts).
 * Used by the prerender step; in dev mode useDocumentHead() applies the essentials.
 */
import { site, languages, defaultLang } from "../config/site.js";
import { createTranslator, langCodes } from "./i18n.jsx";
import { localizedHome } from "./paths.js";
import { photoUrl } from "./images.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function fontHref(lang) {
  const fonts = languages[lang]?.fonts;
  return fonts ? `https://fonts.googleapis.com/css2?${fonts}&display=swap` : null;
}

export function buildHead(lang) {
  const { t } = createTranslator(lang);
  const abs = (path) => new URL(path, site.url).href;
  const canonical = abs(localizedHome(lang));
  const font = fontHref(lang);

  return [
    `<title>${esc(t("meta.title"))}</title>`,
    `<meta name="description" content="${esc(t("meta.description"))}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    ...langCodes.map((code) => `<link rel="alternate" hreflang="${languages[code].htmlLang}" href="${abs(localizedHome(code))}" />`),
    `<link rel="alternate" hreflang="x-default" href="${abs(localizedHome(defaultLang))}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(site.name)}" />`,
    `<meta property="og:title" content="${esc(t("meta.title"))}" />`,
    `<meta property="og:description" content="${esc(t("meta.description"))}" />`,
    `<meta property="og:image" content="${esc(photoUrl("hero-fuji", 1200))}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    font ? `<link rel="stylesheet" id="font-lang" href="${font}" />` : "",
  ].join("\n    ");
}
