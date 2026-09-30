import styles from "./StepItem.module.css";

/** Numbered planning step. Props: number, title, text */
export default function StepItem({ number, title, text }) {
  return (
    <li className={`${styles.step} reveal`} style={{ "--delay": `${(number - 1) * 0.12}s` }}>
      <span className={styles.no}>{String(number).padStart(2, "0")}</span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </li>
  );
}
