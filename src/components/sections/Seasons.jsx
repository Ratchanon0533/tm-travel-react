import { lazy, Suspense, useEffect, useRef, useState } from "react";
import SectionHeading from "../ui/SectionHeading.jsx";
import SeasonPanel from "../seasons/SeasonPanel.jsx";
import { seasons } from "../../lib/content.js";
import { useI18n } from "../../lib/i18n.jsx";
import { useMediaQuery, usePrefersReducedMotion } from "../../hooks/useMediaQuery.js";
import { use3D } from "../../hooks/use3D.js";
import { useInView } from "../../hooks/useInView.js";
import styles from "./Seasons.module.css";

// Petals / fireflies / leaves / snow (three.js), downloaded only by browsers that can show them
const SeasonParticles = lazy(() => import("../three/SeasonParticles.jsx"));

/** Season id for today's month: Mar–May spring, Jun–Aug summer, Sep–Nov autumn, Dec–Feb winter */
function currentSeason() {
  const m = new Date().getMonth();
  return m >= 2 && m <= 4 ? "spring" : m >= 5 && m <= 7 ? "summer" : m >= 8 && m <= 10 ? "autumn" : "winter";
}

/**
 * Four expanding season panels (src/data/seasons.json) with 3D particles for the open season.
 * The current season opens first.
 */
export default function Seasons() {
  const { t } = useI18n();
  const ref = useRef(null);
  const [active, setActive] = useState(seasons[0].id);
  const hoverToOpen = useMediaQuery("(hover: hover) and (min-width: 901px)");
  const has3D = use3D();
  const reduceMotion = usePrefersReducedMotion();
  const inView = useInView(ref);
  const [seen, setSeen] = useState(false); // start the particles only once the section comes near

  useEffect(() => setActive(currentSeason()), []);
  useEffect(() => { if (inView) setSeen(true); }, [inView]);

  return (
    <section ref={ref} className={`section ${styles.seasons}`} id="seasons">
      <div className="container">
        <SectionHeading eyebrow={t("seasons.eyebrow")} title={t("seasons.title")} sub={t("seasons.sub")} />
        <div className={`${styles.panels} reveal`}>
          {seasons.map((s) => (
            <SeasonPanel key={s.id} season={s} active={s.id === active} onActivate={() => setActive(s.id)} hoverToOpen={hoverToOpen} />
          ))}
          {has3D && !reduceMotion && seen && (
            <Suspense fallback={null}>
              <SeasonParticles season={active} running={inView} />
            </Suspense>
          )}
        </div>
      </div>
    </section>
  );
}
