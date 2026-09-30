/** Join class names, skipping falsy values:  cx(styles.card, isActive && styles.active) */
export const cx = (...classes) => classes.filter(Boolean).join(" ");
