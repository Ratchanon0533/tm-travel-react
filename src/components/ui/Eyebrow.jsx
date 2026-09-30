import Icon from "./Icon.jsx";
import { cx } from "../../lib/cx.js";
import styles from "./Eyebrow.module.css";

/** Small uppercase label with the gold logo chevron.  <Eyebrow light>Start Planning</Eyebrow> */
export default function Eyebrow({ light = false, className, children }) {
  return (
    <p className={cx(styles.eyebrow, light && styles.light, className)}>
      <Icon name="chevron" size={18} className={styles.mark} />
      <span>{children}</span>
    </p>
  );
}
