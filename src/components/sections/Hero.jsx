import { useEffect, useState } from "react";
import Button from "../ui/Button.jsx";
import { site } from "../../config/site.js";
import { hero } from "../../lib/content.js";
import { useI18n } from "../../lib/i18n.jsx";
import { photoUrl, photoSrcset } from "../../lib/images.js";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery.js";
import { cx } from "../../lib/cx.js";
import styles from "./Hero.module.css";

const WIDTHS = [960, 1440, 1920, 2560];

/**
 * Full-screen hero with a cross-fading, slowly zooming photo slideshow.
 * Slides: src/data/hero.json · speed: site.heroIntervalMs
 */
export default function Hero() {
  const { t, tx } = useI18n();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  // Auto-advance (restarts whenever the slide changes, so clicking a dot resets the timer)
  useEffect(() => {
    if (reduceMotion || paused) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % hero.length), site.heroIntervalMs);
    return () => clearTimeout(id);
  }, [index, reduceMotion, paused]);

  // Pause while the tab is hidden
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <section className={styles.hero} id="top" aria-label={t("hero.tagline") || site.taglineJa} style={{ "--slide-ms": `${site.heroIntervalMs}ms`, "--slides": hero.length }}>
      <div className={styles.slides} aria-hidden="true">
        {hero.map((slide, i) => (
          <div key={slide.photo} className={cx(styles.slide, i === index && styles.active)}>
            <img
              src={photoUrl(slide.photo, 1920)}
              srcSet={photoSrcset(slide.photo, WIDTHS)}
              sizes="100vw"
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "low"}
              decoding="async"
            />
          </div>
        ))}
      </div>
      <div className={styles.overlay} />

      <div className={cx("container", styles.content)}>
        <p className={cx(styles.tagline, styles.anim)}>
          <span className={styles.jp} lang="ja">{site.taglineJa}</span>
          {/* translation of the tagline — left empty in ja.json, where it would repeat itself */}
          {t("hero.tagline") && (
            <>
              <span className={styles.sep} />
              <span>{t("hero.tagline")}</span>
            </>
          )}
        </p>
        <h1 className={cx(styles.title, styles.anim)} dangerouslySetInnerHTML={{ __html: t("hero.title") }} />
        <p className={cx(styles.sub, styles.anim)}>{t("hero.sub")}</p>
        <div className={cx(styles.ctas, styles.anim)}>
          <Button href="#destinations" iconRight="arrow">{t("hero.cta1")}</Button>
          <Button href="#contact" variant="ghost">{t("hero.cta2")}</Button>
        </div>
      </div>

      <div className={cx("container", styles.bottom)}>
        <div className={styles.dots} role="tablist" aria-label="Slides">
          {hero.map((slide, i) => (
            <button
              key={slide.photo}
              className={cx(styles.dot, i === index && styles.dotActive, i < index && styles.dotDone)}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
            >
              {/* key changes on every slide so the progress animation restarts */}
              <i key={i === index ? `active-${index}` : "idle"} />
              <span>{tx(slide.caption)}</span>
            </button>
          ))}
        </div>
        <a className={styles.scroll} href="#about"><span>{t("hero.scroll")}</span><i /></a>
      </div>
    </section>
  );
}
