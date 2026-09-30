import Icon from "./Icon.jsx";
import { cx } from "../../lib/cx.js";
import styles from "./Button.module.css";

/**
 * <Button href="#contact" variant="gold" iconRight="arrow">Label</Button>
 * variant: "gold" | "ghost" | "navy"   size: "md" | "sm"
 * Renders <a> when `href` is given, otherwise <button>.
 */
export default function Button({ href, variant = "gold", size = "md", iconLeft, iconRight, external, className, children, ...rest }) {
  const Tag = href ? "a" : "button";
  const tagProps = href ? { href, ...(external && { target: "_blank", rel: "noopener" }) } : { type: "button" };
  return (
    <Tag className={cx(styles.btn, styles[variant], size === "sm" && styles.sm, className)} {...tagProps} {...rest}>
      {iconLeft && <Icon name={iconLeft} />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} className={styles.iconRight} />}
    </Tag>
  );
}
