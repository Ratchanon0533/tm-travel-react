import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Button from "../ui/Button.jsx";
import { site } from "../../config/site.js";
import { destinations, hero } from "../../lib/content.js";
import { useI18n } from "../../lib/i18n.jsx";
import { photoUrl, photoSrcset } from "../../lib/images.js";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery.js";
import { use3D } from "../../hooks/use3D.js";
import { useInView } from "../../hooks/useInView.js";
import { cx } from "../../lib/cx.js";
import styles from "./Hero.module.css";

// The 3D map (three.js) is downloaded only by browsers that can show it, after the page is visible
const JapanMap = lazy(() => import("../three/JapanMap.jsx"));

const OVERVIEW = -1; // tour position before the first destination
const OVERVIEW_MS = 3000;

/**
 * Full-screen hero over a 3D map of Japan that tours the destinations
 * (pins: "coords" in src/data/destinations/*.json · speed: site.heroIntervalMs).
 * Browsers without WebGL see the first photo from src/data/hero.json instead.
 */
export default function Hero() {
  const { t, tx } = useI18n();
  const ref = useRef(null);
  const [index, setIndex] = useState(OVERVIEW);
  const [paused, setPaused] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const has3D = use3D();
  const inView = useInView(ref);
  const running = inView && !paused;

  const tour = useMemo(
    () => destinations.filter((d) => d.coords).map((d) => ({ id: d.id, coords: d.coords, home: Boolean(d.home), name: tx(d.name), region: tx(d.region) })),
    [tx],
  );

  // Auto-advance (restarts whenever the stop changes, so clicking a bar or pin resets the timer)
  useEffect(() => {
    if (!has3D || reduceMotion || !running) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % tour.length), index === OVERVIEW ? OVERVIEW_MS : site.heroIntervalMs);
    return () => clearTimeout(id);
  }, [index, has3D, reduceMotion, running, tour.length]);

  // Pause while the tab is hidden
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const stop = tour[index];

  return (
    <section ref={ref} className={cx(styles.hero, !running && styles.paused)} id="top" aria-label={t("hero.tagline") || site.taglineJa} style={{ "--slide-ms": `${site.heroIntervalMs}ms` }}>
      <div className={styles.stage} aria-hidden="true">
        {has3D && (
          <Suspense fallback={null}>
            <JapanMap places={tour} active={index} onSelect={setIndex} running={running} still={reduceMotion} homeLabel={t("dest.home")} />
          </Suspense>
        )}
        {has3D === false && (
          <img className={styles.poster} src={photoUrl(hero[0].photo, 1920)} srcSet={photoSrcset(hero[0].photo, [960, 1440, 1920, 2560])} sizes="100vw" alt="" decoding="async" />
        )}
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
        {has3D && (
          <div className={styles.tour}>
            <p className={styles.stop} aria-live="polite">
              {stop ? (
                <>
                  <em>{String(index + 1).padStart(2, "0")}</em>
                  <strong>{stop.name}</strong>
                  <span>{stop.region}</span>
                </>
              ) : (
                <span>{t("hero.mapHint")}</span>
              )}
            </p>
            <div className={styles.bars}>
              {tour.map((d, i) => (
                <button
                  key={d.id}
                  className={cx(styles.bar, i === index && styles.barActive, i < index && styles.barDone)}
                  type="button"
                  aria-label={d.name}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => setIndex(i)}
                >
                  {/* key changes on every stop so the progress animation restarts */}
                  <i key={i === index ? `active-${index}` : "idle"} />
                </button>
              ))}
            </div>
          </div>
        )}
        <a className={styles.scroll} href="#about"><span>{t("hero.scroll")}</span><i /></a>
      </div>
    </section>
  );
}
