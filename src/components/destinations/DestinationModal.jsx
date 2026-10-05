import { useEffect, useRef, useState } from "react";
import Icon from "../ui/Icon.jsx";
import Eyebrow from "../ui/Eyebrow.jsx";
import Button from "../ui/Button.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { photoUrl } from "../../lib/images.js";
import { cx } from "../../lib/cx.js";
import styles from "./DestinationModal.module.css";

/**
 * Detail popup using the native <dialog> element (handles Esc, focus and backdrop).
 * Opens when `destination` is set; calls onClose when dismissed.
 * With `position` ([number, total]) visitors can browse to the previous / next destination
 * with the arrows, the ← → keys or by swiping; onBrowse(-1 | 1) is called.
 */
export default function DestinationModal({ destination: d, position, onBrowse, onClose }) {
  const { lang, t, tx } = useI18n();
  const ref = useRef(null);
  const swipe = useRef(null);
  const [dir, setDir] = useState(0); // direction of the last browse, for the slide-in
  const canBrowse = position && position[1] > 1;

  useEffect(() => {
    const dialog = ref.current;
    if (d && !dialog.open) dialog.showModal();
    if (!d && dialog.open) dialog.close();
    if (d) dialog.scrollTop = 0; // bottom sheet on phones: start each place at the top
    document.body.classList.toggle("no-scroll", Boolean(d));
  }, [d]);

  const close = () => { setDir(0); onClose(); };
  const browse = (step) => { if (canBrowse) { setDir(step); onBrowse(step); } };
  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") browse(-1);
    if (e.key === "ArrowRight") browse(1);
  };
  const onTouchStart = (e) => { swipe.current = [e.touches[0].clientX, e.touches[0].clientY]; };
  const onTouchEnd = (e) => {
    if (!swipe.current) return;
    const dx = e.changedTouches[0].clientX - swipe.current[0];
    const dy = e.changedTouches[0].clientY - swipe.current[1];
    swipe.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) browse(dx < 0 ? 1 : -1);
  };

  return (
    <dialog
      ref={ref}
      className={styles.modal}
      aria-label={d ? tx(d.name) : undefined}
      onClose={close}
      onClick={(e) => e.target === ref.current && close()}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button className={styles.close} type="button" aria-label={t("modal.close")} onClick={close}>
        <Icon name="close" size={22} />
      </button>
      {d && canBrowse && (
        <div className={styles.browse}>
          <button type="button" aria-label={t("modal.prev")} onClick={() => browse(-1)}><Icon name="arrow" size={18} className={styles.back} /></button>
          <span aria-live="polite">{position[0]} / {position[1]}</span>
          <button type="button" aria-label={t("modal.next")} onClick={() => browse(1)}><Icon name="arrow" size={18} /></button>
        </div>
      )}
      {d && (
        // a new key per place, so it slides in from the side it came from
        <article key={d.id} className={cx(styles.panel, dir && styles.swap)} style={{ "--from": `${dir * 40}px` }}>
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
            <Button href="#contact" variant="navy" iconRight="arrow" onClick={close}>{t("dest.plan")}</Button>
          </div>
        </article>
      )}
    </dialog>
  );
}
