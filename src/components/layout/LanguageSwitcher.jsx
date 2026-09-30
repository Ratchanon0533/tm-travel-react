import { useEffect, useRef, useState } from "react";
import Icon from "../ui/Icon.jsx";
import { languages } from "../../config/site.js";
import { langCodes, useI18n } from "../../lib/i18n.jsx";
import { localizedHome } from "../../lib/paths.js";
import { cx } from "../../lib/cx.js";
import styles from "./LanguageSwitcher.module.css";

/**
 * Language dropdown. Each language is its own page ("/", "/th/", "/zh/", "/ko/").
 * `dark` = navy text for the white (scrolled) header.
 */
export default function LanguageSwitcher({ dark = false }) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);

  // Keep the visitor on the same section when switching language
  const onPick = (e, code) => {
    try { localStorage.setItem("tm-lang", code); } catch { /* storage unavailable */ }
    if (window.location.hash) e.currentTarget.href = localizedHome(code) + window.location.hash;
  };

  return (
    <div ref={ref} className={cx(styles.lang, open && styles.open, dark && styles.dark)}>
      <button className={styles.btn} type="button" aria-haspopup="true" aria-expanded={open} aria-label={t("lang.label")} onClick={() => setOpen((o) => !o)}>
        <Icon name="globe" />
        <span>{lang.toUpperCase()}</span>
      </button>
      <ul className={styles.menu}>
        {langCodes.map((code) => (
          <li key={code}>
            <a href={localizedHome(code)} hrefLang={languages[code].htmlLang} lang={languages[code].htmlLang} aria-current={code === lang ? "true" : undefined} onClick={(e) => onPick(e, code)}>
              {languages[code].label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
