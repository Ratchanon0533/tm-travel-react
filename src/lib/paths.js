import { defaultLang, languages } from "../config/site.js";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Path to a file in /public, respecting Vite's `base`. */
export function asset(path) {
  return `${base}/${path.replace(/^\//, "")}`;
}

/** Home page URL for a language: "/" for the default, "/th/" etc. for others. */
export function localizedHome(lang) {
  return lang === defaultLang ? `${base}/` : `${base}/${lang}/`;
}

/** Reads the language from a URL path ("/th/" → "th"), falling back to the default. */
export function langFromPath(pathname) {
  const rest = pathname.slice(base.length).replace(/^\/+/, "");
  const first = rest.split("/")[0];
  return first in languages ? first : defaultLang;
}
