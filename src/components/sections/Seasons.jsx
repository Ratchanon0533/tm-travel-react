import { useEffect, useState } from "react";
import SectionHeading from "../ui/SectionHeading.jsx";
import SeasonPanel from "../seasons/SeasonPanel.jsx";
import { seasons } from "../../lib/content.js";
import { useI18n } from "../../lib/i18n.jsx";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";
import styles from "./Seasons.module.css";

/** Season id for today's month: Mar–May spring, Jun–Aug summer, Sep–Nov autumn, Dec–Feb winter */
function currentSeason() {
  const m = new Date().getMonth();
  return m >= 2 && m <= 4 ? "spring" : m >= 5 && m <= 7 ? "summer" : m >= 8 && m <= 10 ? "autumn" : "winter";
}

/** Four expanding season panels (src/data/seasons.json). The current season opens first. */
export default function Seasons() {
  const { t } = useI18n();
  const [active, setActive] = useState(seasons[0].id);
  const hoverToOpen = useMediaQuery("(hover: hover) and (min-width: 901px)");

  useEffect(() => setActive(currentSeason()), []);

  return (
    <section className={`section ${styles.seasons}`} id="seasons">
      <div className="container">
        <SectionHeading eyebrow={t("seasons.eyebrow")} title={t("seasons.title")} sub={t("seasons.sub")} />
        <div className={`${styles.panels} reveal`}>
          {seasons.map((s) => (
            <SeasonPanel key={s.id} season={s} active={s.id === active} onActivate={() => setActive(s.id)} hoverToOpen={hoverToOpen} />
          ))}
        </div>
      </div>
    </section>
  );
}
