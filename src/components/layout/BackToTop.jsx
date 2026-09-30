import Icon from "../ui/Icon.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { useScrolled } from "../../hooks/useScrolled.js";
import { cx } from "../../lib/cx.js";
import styles from "./BackToTop.module.css";

const pastFirstScreen = () => window.innerHeight * 0.8;

export default function BackToTop() {
  const { t } = useI18n();
  const visible = useScrolled(pastFirstScreen);
  return (
    <button className={cx(styles.toTop, visible && styles.visible)} type="button" aria-label={t("backTop")} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      <Icon name="chevron" size={22} />
    </button>
  );
}
