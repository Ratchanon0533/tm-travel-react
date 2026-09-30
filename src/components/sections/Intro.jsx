import SectionHeading from "../ui/SectionHeading.jsx";
import FeatureCard from "../intro/FeatureCard.jsx";
import { features } from "../../lib/content.js";
import { useI18n } from "../../lib/i18n.jsx";
import styles from "./Intro.module.css";

/** "About" section: company introduction + feature cards (src/data/features.json). */
export default function Intro() {
  const { t } = useI18n();
  return (
    <section className={`section ${styles.intro}`} id="about">
      <span className={styles.watermark} lang="ja" aria-hidden="true">日本へようこそ</span>
      <div className={`container ${styles.grid}`}>
        <div>
          <SectionHeading eyebrow={t("intro.eyebrow")} title={t("intro.title")} align="left">
            <p className="lead">{t("intro.body")}</p>
            <p className={styles.more}>{t("intro.body2")}</p>
          </SectionHeading>
        </div>
        <ul className={styles.features}>
          {features.map((f, i) => (
            <FeatureCard key={f.title} icon={f.icon} title={t(f.title)} text={t(f.text)} delay={i * 0.1} />
          ))}
        </ul>
      </div>
    </section>
  );
}
