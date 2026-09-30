import { useEffect, useRef } from "react";
import Icon from "../ui/Icon.jsx";
import Eyebrow from "../ui/Eyebrow.jsx";
import Button from "../ui/Button.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { photoUrl } from "../../lib/images.js";
import styles from "./DestinationModal.module.css";

/**
 * Detail popup using the native <dialog> element (handles Esc, focus and backdrop).
 * Opens when `destination` is set; calls onClose when dismissed.
 */
export default function DestinationModal({ destination: d, onClose }) {
  const { lang, t, tx } = useI18n();
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (d && !dialog.open) dialog.showModal();
    if (!d && dialog.open) dialog.close();
    document.body.classList.toggle("no-scroll", Boolean(d));
  }, [d]);

  return (
    <dialog ref={ref} className={styles.modal} aria-label={d ? tx(d.name) : undefined} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <button className={styles.close} type="button" aria-label={t("modal.close")} onClick={onClose}>
        <Icon name="close" size={22} />
      </button>
      {d && (
        <article className={styles.panel}>
          <div className={styles.media}>
            <img src={photoUrl(d.photo, 1400)} alt={tx(d.name)} decoding="async" />
          </div>
          <div className={styles.body}>
            <Eyebrow>{tx(d.region)}</Eyebrow>
            <h3 className={styles.title}>{tx(d.name)}</h3>
            <p className={styles.desc}>{tx(d.desc)}</p>
            <h4 className={styles.sub}>{t("dest.highlights")}</h4>
            <ul className={styles.highlights}>
              {(d.highlights[lang] ?? d.highlights.en).map((h) => (
                <li key={h}><Icon name="chevron" size={16} /><span>{h}</span></li>
              ))}
            </ul>
            <dl className={styles.info}>
              <div><dt><Icon name="calendar" />{t("dest.best")}</dt><dd>{tx(d.best)}</dd></div>
              <div><dt><Icon name="train" />{t("dest.access")}</dt><dd>{tx(d.access)}</dd></div>
            </dl>
            <Button href="#contact" variant="navy" iconRight="arrow" onClick={onClose}>{t("dest.plan")}</Button>
          </div>
        </article>
      )}
    </dialog>
  );
}
