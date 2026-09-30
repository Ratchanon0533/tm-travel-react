import Eyebrow from "./Eyebrow.jsx";
import { cx } from "../../lib/cx.js";
import styles from "./SectionHeading.module.css";

/**
 * Section title block.
 * <SectionHeading eyebrow="…" title="…" sub="…" light align="center">optional extra content</SectionHeading>
 */
export default function SectionHeading({ eyebrow, title, sub, light = false, align = "center", className, children }) {
  return (
    <div className={cx(styles.heading, styles[align], light && styles.light, "reveal", className)}>
      {eyebrow && <Eyebrow light={light}>{eyebrow}</Eyebrow>}
      <h2 className={styles.title}>{title}</h2>
      {sub && <p className={styles.sub}>{sub}</p>}
      {children}
    </div>
  );
}
