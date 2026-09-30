import Icon from "../ui/Icon.jsx";
import styles from "./FeatureCard.module.css";

/** <FeatureCard icon="compass" title="…" text="…" delay={0.1} /> */
export default function FeatureCard({ icon, title, text, delay = 0 }) {
  return (
    <li className={`${styles.feature} reveal`} style={{ "--delay": `${delay}s` }}>
      <span className={styles.icon}><Icon name={icon} size={26} /></span>
      <h3>{title}</h3>
      <p>{text}</p>
    </li>
  );
}
