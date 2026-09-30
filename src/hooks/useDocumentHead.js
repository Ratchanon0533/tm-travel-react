import { useEffect } from "react";
import { languages } from "../config/site.js";
import { fontHref } from "../lib/head.js";

/**
 * Keeps <html lang>, <title> and the language font in sync.
 * The prerendered pages already contain these; this matters mainly in `npm run dev`.
 */
export function useDocumentHead(lang, title) {
  useEffect(() => {
    document.documentElement.lang = languages[lang]?.htmlLang ?? lang;
    if (title) document.title = title;
    const href = fontHref(lang);
    if (href && !document.getElementById("font-lang")) {
      const link = Object.assign(document.createElement("link"), { rel: "stylesheet", id: "font-lang", href });
      document.head.appendChild(link);
    }
  }, [lang, title]);
}
