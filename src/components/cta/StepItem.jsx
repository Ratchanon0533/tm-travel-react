import styles from "./StepItem.module.css";

/**
 * Numbered planning step on the timeline. Props: number, title, text, reached (lit up by the gold line).
 * "reached" is a data attribute, not a class: re-rendering the class would drop the scroll-reveal's "is-in".
 */
export default function StepItem({ number, title, text, reached }) {
  return (
    <li className={`${styles.step} reveal`} data-reached={reached || undefined} style={{ "--delay": `${(number - 1) * 0.12}s` }}>
      <span className={styles.no}>{String(number).padStart(2, "0")}</span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </li>
  );
}
