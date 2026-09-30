import { useI18n } from "../../lib/i18n.jsx";
import { photoUrl, photoSrcset } from "../../lib/images.js";
import { useTilt } from "../../hooks/useTilt.js";
import styles from "./ExperienceCard.module.css";

/** Props: experience (src/data/experiences.json), number. The outer element fades in on scroll, the inner card tilts. */
export default function ExperienceCard({ experience: x, number }) {
  const { tx } = useI18n();
  const tilt = useTilt();
  return (
    <article className={`${styles.exp} reveal`} style={{ "--delay": `${(number - 1) * 0.1}s` }}>
      <div ref={tilt} className={styles.card}>
        <div className={styles.media}>
          <img src={photoUrl(x.photo, 800)} srcSet={photoSrcset(x.photo, [480, 800, 1200])} sizes="(max-width:600px) 100vw, (max-width:1100px) 50vw, 25vw" alt={tx(x.title)} loading="lazy" decoding="async" />
        </div>
        <div className={styles.body}>
          <span className={styles.no}>{String(number).padStart(2, "0")}</span>
          <h3>{tx(x.title)}</h3>
          <p>{tx(x.desc)}</p>
        </div>
      </div>
    </article>
  );
}
