// Prerender entry (used only by `npm run build` → scripts/prerender.js).
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./App.jsx";
import { buildHead } from "./lib/head.js";
import { languages, defaultLang } from "./config/site.js";

export { languages, defaultLang };

export function render(lang) {
  return {
    html: renderToString(
      <StrictMode>
        <App lang={lang} />
      </StrictMode>,
    ),
    head: buildHead(lang),
    htmlLang: languages[lang].htmlLang,
  };
}
