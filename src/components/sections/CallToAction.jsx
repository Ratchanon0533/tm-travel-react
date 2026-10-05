import { useEffect, useRef, useState } from "react";
import Eyebrow from "../ui/Eyebrow.jsx";
import Button from "../ui/Button.jsx";
import StepItem from "../cta/StepItem.jsx";
import { site } from "../../config/site.js";
import { steps } from "../../lib/content.js";
import { useI18n } from "../../lib/i18n.jsx";
import { photoUrl } from "../../lib/images.js";
import styles from "./CallToAction.module.css";

/**
 * Closing "start planning" section: parallax photo, contact buttons and three steps on a
 * timeline that fills in gold as you scroll (each step lights up as the line reaches it).
 */
export default function CallToAction({ photo = "cta-bg" }) {
  const { t } = useI18n();
  const sectionRef = useRef(null);
  const bgRef = useRef(null);
  const stepsRef = useRef(null);
  const [reached, setReached] = useState(0); // steps the gold line has reached

  useEffect(() => {
    const parallax = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const update = () => {
      const r = sectionRef.current.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      // Gentle parallax on the background photo
      if (parallax) {
        const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        bgRef.current.style.transform = `translate3d(0, ${(p * -40).toFixed(1)}px, 0)`;
      }
      // Timeline: the gold line runs from the first step's dot to the last one's (dots sit 40px
      // below the top of each step) and reaches 65% of the way down the window
      const list = stepsRef.current;
      const items = [...list.querySelectorAll("li")];
      const track = items[items.length - 1].offsetTop;
      const y = window.innerHeight * 0.65 - list.getBoundingClientRect().top;
      list.style.setProperty("--track", `${track}px`);
      list.style.setProperty("--fill", Math.min(Math.max((y - 40) / track, 0), 1).toFixed(3));
      setReached(items.filter((li) => li.offsetTop + 40 <= y).length);
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
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
        <ol ref={stepsRef} className={styles.steps}>
          {steps.map((s, i) => <StepItem key={s.title} number={i + 1} title={t(s.title)} text={t(s.text)} reached={i < reached} />)}
        </ol>
      </div>
    </section>
  );
}
