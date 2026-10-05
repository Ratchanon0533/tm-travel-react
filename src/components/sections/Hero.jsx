import { useEffect, useRef, useState } from "react";
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
 * Change slides with the captions (← → keys work on them) or by swiping on touch screens;
 * on desktop the photo drifts gently against the mouse.
 * Slides: src/data/hero.json · speed: site.heroIntervalMs
 */
export default function Hero() {
  const { t, tx } = useI18n();
  const ref = useRef(null);
  const swipe = useRef(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const step = (dir, from = index) => (from + dir + hero.length) % hero.length;

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

  // Mouse parallax: sets --mx / --my (-0.5 … 0.5) for the CSS. Mouse only, and not with "reduce motion".
  useEffect(() => {
    const el = ref.current;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const set = (x, y) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--mx", x.toFixed(3));
        el.style.setProperty("--my", y.toFixed(3));
      });
    };
    const onMove = (e) => set(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
    const onLeave = () => set(0, 0);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Swipe left / right to change slides (mostly-horizontal swipes only, so scrolling still works)
  const onTouchStart = (e) => { swipe.current = [e.touches[0].clientX, e.touches[0].clientY]; };
  const onTouchEnd = (e) => {
    if (!swipe.current) return;
    const dx = e.changedTouches[0].clientX - swipe.current[0];
    const dy = e.changedTouches[0].clientY - swipe.current[1];
    swipe.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) setIndex(step(dx < 0 ? 1 : -1));
  };

  // ← → move between the slide captions, like tabs
  const onDotsKey = (e) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const tabs = [...e.currentTarget.children];
    const next = step(dir, tabs.includes(document.activeElement) ? tabs.indexOf(document.activeElement) : index);
    setIndex(next);
    tabs[next].focus();
  };

  return (
    <section
      ref={ref}
      className={styles.hero}
      id="top"
      aria-label={t("hero.tagline") || site.taglineJa}
      style={{ "--slide-ms": `${site.heroIntervalMs}ms`, "--slides": hero.length }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
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
        <div className={styles.dots} role="tablist" aria-label="Slides" onKeyDown={onDotsKey}>
          {hero.map((slide, i) => (
            <button
              key={slide.photo}
              className={cx(styles.dot, i === index && styles.dotActive, i < index && styles.dotDone)}
              type="button"
              role="tab"
              aria-selected={i === index}
              tabIndex={i === index ? 0 : -1}
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
