import { useEffect, useRef, useState } from "react";
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
 * Includes the main nav, language switcher, CTA button, mobile menu (a curtain that drops from the top)
 * and a thin gold bar along the bottom showing how far down the page you are.
 */
export default function Header() {
  const { lang, t } = useI18n();
  const scrolled = useScrolled(60);
  const [navOpen, setNavOpen] = useState(false);
  const [activeHref, setActiveHref] = useState(null);
  const progress = useRef(null);

  // Reading progress: scale the gold bar with the scroll position
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Lock page scroll while the mobile menu is open; close it when resizing to desktop
  useEffect(() => {
    document.body.classList.toggle("no-scroll", navOpen);
    const onResize = () => window.innerWidth > 900 && setNavOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [navOpen]);

  // Track the section in view (none over the hero): it highlights its nav link, tells the language
  // switcher where the visitor is, and becomes the #section in the address bar — so a reload returns
  // to where the visitor is now, not to the last link they clicked. The address bar is left alone until
  // the page has loaded, while the browser may still be scrolling to the #section it was opened with.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    let loaded = document.readyState === "complete";
    const onLoad = () => { loaded = true; };
    window.addEventListener("load", onLoad);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const hash = e.target.id === "top" ? "" : "#" + e.target.id;
        setActiveHref(hash || null);
        const { pathname, search } = window.location;
        if (loaded && window.location.hash !== hash) history.replaceState(history.state, "", pathname + search + hash);
      }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ["#top", ...navigation.map((item) => item.href)].forEach((href) => { const el = document.querySelector(href); if (el) io.observe(el); });
    return () => {
      io.disconnect();
      window.removeEventListener("load", onLoad);
    };
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
          <LanguageSwitcher dark={solid} section={activeHref} />
          <Button href="#contact" size="sm" className={styles.cta}>{t("nav.plan")}</Button>
          <button className={styles.burger} type="button" aria-label="Menu" aria-controls="mainNav" aria-expanded={navOpen} onClick={() => setNavOpen((o) => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
      <span ref={progress} className={styles.progress} aria-hidden="true" />
    </header>
  );
}
