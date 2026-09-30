import { useI18n } from "../../lib/i18n.jsx";
import { photoUrl } from "../../lib/images.js";
import { cx } from "../../lib/cx.js";
import styles from "./SeasonPanel.module.css";

/** One expanding season panel. Props: season (src/data/seasons.json), active, onActivate, hoverToOpen */
export default function SeasonPanel({ season: s, active, onActivate, hoverToOpen }) {
  const { lang, tx } = useI18n();
  return (
    <article
      className={cx(styles.season, active && styles.active)}
      tabIndex={0}
      aria-expanded={active}
      onClick={onActivate}
      onMouseEnter={hoverToOpen ? onActivate : undefined}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onActivate(); } }}
    >
      <img src={photoUrl(s.photo, 1400)} alt={tx(s.title)} loading="lazy" decoding="async" />
      <span className={styles.kanji} lang="ja">{s.kanji}</span>
      <span className={styles.label}>{tx(s.name)}</span>
      <div className={styles.content}>
        <span className={styles.months}>{tx(s.name)} · {tx(s.months)}</span>
        <h3>{tx(s.title)}</h3>
        <p>{tx(s.desc)}</p>
        <ul className={styles.tags}>{(s.tags[lang] ?? s.tags.en).map((tag) => <li key={tag}>{tag}</li>)}</ul>
      </div>
    </article>
  );
}
