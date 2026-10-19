import { cx } from "../../lib/cx.js";
import styles from "./Logo.module.css";

/**
 * TM Travel logo: the brand mark (redrawn from the original logo) and "TM TRAVEL".
 * The gold stays gold; the lower part of the mark and the name take the text color (navy or white).
 * Size: set font-size on it (the mark is 1em tall).
 */
export default function Logo({ className }) {
  return (
    <span className={cx(styles.logo, className)}>
      <svg className={styles.mark} viewBox="0 0 75 75" aria-hidden="true">
        <path fill="#f8b62d" d="M0 2h75v31L37.5 6.5 0 33z" />
        <path fill="currentColor" d="M32 24v27.2L0 73.5V46zM43 24v27.2l32 22.3V46z" />
      </svg>
      <span className={styles.name}>TM TRAVEL</span>
    </span>
  );
}
