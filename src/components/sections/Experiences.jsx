import SectionHeading from "../ui/SectionHeading.jsx";
import ExperienceCard from "../experiences/ExperienceCard.jsx";
import { experiences } from "../../lib/content.js";
import { useI18n } from "../../lib/i18n.jsx";
import styles from "./Experiences.module.css";

/** Signature experiences on a deep-navy background (src/data/experiences.json). */
export default function Experiences() {
  const { t } = useI18n();
  return (
    <section className={`section ${styles.experiences}`} id="experiences">
      <div className="container">
        <SectionHeading eyebrow={t("exp.eyebrow")} title={t("exp.title")} sub={t("exp.sub")} light />
        <div className={styles.grid}>
          {experiences.map((x, i) => <ExperienceCard key={x.id} experience={x} number={i + 1} />)}
        </div>
      </div>
    </section>
  );
}
