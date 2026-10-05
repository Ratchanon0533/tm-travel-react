import { useEffect, useState } from "react";
import Icon from "../ui/Icon.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { photoUrl } from "../../lib/images.js";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery.js";
import { cx } from "../../lib/cx.js";
import styles from "./SeasonPanel.module.css";

const SLIDE_MS = 3500; // time per photo while the panel is open

/**
 * One expanding season panel. While open (on desktop: while the mouse is over it) it plays a slideshow
 * of that season's places, with the place name at the top and a bar per photo (click one to jump to it).
 * Props: season (src/data/seasons.json — photos and places in "slides"), active, onActivate, hoverToOpen
 */
export default function SeasonPanel({ season: s, active, onActivate, hoverToOpen }) {
  const { lang, tx } = useI18n();
  const reduceMotion = usePrefersReducedMotion();
  const [slide, setSlide] = useState(0);
  const [opened, setOpened] = useState(false); // load the other photos only once the panel has stayed open a moment

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setOpened(true), 500); // not for a mouse just passing over it
    return () => clearTimeout(id);
  }, [active]);

  // Next photo after SLIDE_MS (restarts whenever the photo changes, so a clicked bar gets its full time)
  useEffect(() => {
    if (!active || reduceMotion || s.slides.length < 2) return;
    const id = setTimeout(() => setSlide((i) => (i + 1) % s.slides.length), SLIDE_MS);
    return () => clearTimeout(id);
  }, [active, slide, reduceMotion, s.slides.length]);

  const current = s.slides[slide];

  return (
    <article
      className={cx(styles.season, active && styles.active)}
      style={{ "--slide-ms": `${SLIDE_MS}ms` }}
      tabIndex={0}
      aria-expanded={active}
      onClick={onActivate}
      onMouseEnter={hoverToOpen ? onActivate : undefined}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onActivate(); } }}
    >
      {s.slides.map((sl, i) => (i === 0 || opened) && (
        <img
          key={sl.photo}
          className={cx(i === slide && styles.current)}
          src={photoUrl(sl.photo, 1400)}
          alt={i === slide ? tx(sl.place) : ""}
          loading="lazy"
          decoding="async"
        />
      ))}
      <span className={styles.kanji} lang="ja">{s.kanji}</span>
      <span className={styles.label}>{tx(s.name)}</span>
      {/* key: the name fades in again for every photo */}
      <span key={slide} className={styles.place}><Icon name="pin" size={14} />{tx(current.place)}</span>
      <div className={styles.content}>
        <span className={styles.months}>{tx(s.name)} · {tx(s.months)}</span>
        <h3>{tx(s.title)}</h3>
        <p>{tx(s.desc)}</p>
        <ul className={styles.tags}>{(s.tags[lang] ?? s.tags.en).map((tag) => <li key={tag}>{tag}</li>)}</ul>
        {s.slides.length > 1 && (
          <div className={styles.bars}>
            {s.slides.map((sl, i) => (
              <button
                key={sl.photo}
                className={cx(styles.bar, i === slide && styles.barOn)}
                type="button"
                aria-label={tx(sl.place)}
                aria-current={i === slide ? "true" : undefined}
                onClick={() => setSlide(i)}
              >
                {/* key changes on every photo so the progress animation restarts */}
                <i key={i === slide ? `on-${slide}` : "off"} />
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
