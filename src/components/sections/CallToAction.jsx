import { useEffect, useRef } from "react";
import Eyebrow from "../ui/Eyebrow.jsx";
import Button from "../ui/Button.jsx";
import StepItem from "../cta/StepItem.jsx";
import { site } from "../../config/site.js";
import { steps } from "../../lib/content.js";
import { useI18n } from "../../lib/i18n.jsx";
import { photoUrl } from "../../lib/images.js";
import styles from "./CallToAction.module.css";

/** Closing "start planning" section: parallax photo, contact buttons and three steps. */
export default function CallToAction({ photo = "cta-bg" }) {
  const { t } = useI18n();
  const sectionRef = useRef(null);
  const bgRef = useRef(null);

  // Gentle parallax on the background photo
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = sectionRef.current.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
          bgRef.current.style.transform = `translate3d(0, ${(p * -40).toFixed(1)}px, 0)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);

  return (
    <section ref={sectionRef} className={styles.cta} id="contact">
      <div ref={bgRef} className={styles.bg} style={{ backgroundImage: `url('${photoUrl(photo, 1920)}')` }} aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        <div className="reveal">
          <Eyebrow light>{t("cta.eyebrow")}</Eyebrow>
          <h2 className={styles.title}>{t("cta.title")}</h2>
          <p className={`lead ${styles.lead}`}>{t("cta.body")}</p>
          <div className={styles.buttons}>
            <Button href={site.phoneHref} iconLeft="phone">{t("cta.call")}</Button>
            <Button href={site.japaneseSiteUrl} variant="ghost" external>{t("cta.jp")}</Button>
          </div>
        </div>
        <ol className={styles.steps}>
          {steps.map((s, i) => <StepItem key={s.title} number={i + 1} title={t(s.title)} text={t(s.text)} />)}
        </ol>
      </div>
    </section>
  );
}
