import { useEffect, useState } from "react";
import Button from "../ui/Button.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import { site, navigation } from "../../config/site.js";
import { useI18n } from "../../lib/i18n.jsx";
import { asset, localizedHome } from "../../lib/paths.js";
import { useScrolled } from "../../hooks/useScrolled.js";
import { cx } from "../../lib/cx.js";
import styles from "./Header.module.css";

/**
 * Fixed header: transparent over the hero (white logo), solid white after scrolling (color logo).
 * Includes the main nav, language switcher, CTA button and mobile menu (a curtain that drops from the top).
 */
export default function Header() {
  const { lang, t } = useI18n();
  const scrolled = useScrolled(60);
  const [navOpen, setNavOpen] = useState(false);
  const [activeHref, setActiveHref] = useState(null);

  // Lock page scroll while the mobile menu is open; close it when resizing to desktop
  useEffect(() => {
    document.body.classList.toggle("no-scroll", navOpen);
    const onResize = () => window.innerWidth > 900 && setNavOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [navOpen]);

  // Highlight the nav link of the section in view
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveHref("#" + e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    navigation.forEach(({ href }) => { const el = document.querySelector(href); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  const solid = scrolled && !navOpen;

  return (
    <header className={cx(styles.header, solid && styles.solid, navOpen && styles.navOpen)}>
      <div className={cx("container", styles.inner)}>
        <a className={styles.brand} href={localizedHome(lang)} aria-label={`${site.name} — Home`}>
          <img className={cx(styles.logo, styles.logoLight)} src={asset(site.logo.white)} alt={site.name} width={site.logo.width} height={site.logo.height} />
          <img className={cx(styles.logo, styles.logoDark)} src={asset(site.logo.color)} alt="" width={site.logo.width} height={site.logo.height} aria-hidden="true" />
          <span className={styles.tagline} lang="ja">{site.taglineJa}</span>
        </a>

        <nav className={styles.nav} id="mainNav" aria-label="Main">
          <ul>
            {navigation.map((item, i) => (
              // --i staggers the links in the mobile menu
              <li key={item.href} style={{ "--i": i }}>
                <a href={item.href} className={cx(activeHref === item.href && styles.active)} onClick={() => setNavOpen(false)}>
                  {t(item.key)}
                </a>
              </li>
            ))}
          </ul>
          <span className={styles.watermark} lang="ja" aria-hidden="true">旅</span>
        </nav>

        <div className={styles.actions}>
          <LanguageSwitcher dark={solid} />
          <Button href="#contact" size="sm" className={styles.cta}>{t("nav.plan")}</Button>
          <button className={styles.burger} type="button" aria-label="Menu" aria-controls="mainNav" aria-expanded={navOpen} onClick={() => setNavOpen((o) => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
