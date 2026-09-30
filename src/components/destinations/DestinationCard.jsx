import Icon from "../ui/Icon.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { photoUrl, photoSrcset } from "../../lib/images.js";
import { cx } from "../../lib/cx.js";
import { useTilt } from "../../hooks/useTilt.js";
import styles from "./DestinationCard.module.css";

/**
 * One destination tile (tilts toward the mouse).
 * Props: destination (src/data/destinations/*.json), span [cols, rows], index (entrance delay), onOpen
 */
export default function DestinationCard({ destination: d, span = [1, 1], index = 0, onOpen }) {
  const { t, tx } = useI18n();
  const [cols, rows] = span;
  const large = cols === 2 && rows === 2;
  const wide = cols >= 2 && rows === 1;
  const tilt = useTilt(large ? 4 : 6);

  return (
    <button
      ref={tilt}
      type="button"
      className={cx(styles.card, large && styles.large, wide && styles.wide)}
      style={{ gridColumn: `span ${cols}`, gridRow: `span ${rows}`, animationDelay: `${index * 60}ms` }}
      onClick={() => onOpen(d)}
    >
      <img
        src={photoUrl(d.photo, large ? 1200 : 800)}
        srcSet={photoSrcset(d.photo)}
        sizes={large ? "(max-width:600px) 100vw, 50vw" : "(max-width:600px) 100vw, (max-width:900px) 50vw, 25vw"}
        alt={tx(d.name)}
        loading="lazy"
        decoding="async"
      />
      {d.home && <span className={styles.badge}><Icon name="pin" size={14} />{t("dest.home")}</span>}
      <span className={styles.body}>
        <span className={styles.region}>{tx(d.region)}</span>
        <span className={styles.name}>{tx(d.name)}</span>
        <span className={styles.desc}>{tx(d.desc)}</span>
        <span className={styles.more}>{t("dest.view")} <Icon name="arrow" /></span>
      </span>
    </button>
  );
}
