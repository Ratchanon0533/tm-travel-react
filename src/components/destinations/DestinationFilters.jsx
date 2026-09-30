import { filters } from "../../lib/content.js";
import { useI18n } from "../../lib/i18n.jsx";
import styles from "./DestinationFilters.module.css";

/**
 * Category filter buttons. Categories: src/data/filters.json · labels: "filter.<name>" in src/i18n.
 */
export default function DestinationFilters({ value, onChange }) {
  const { t } = useI18n();
  return (
    <div className={`${styles.filters} reveal`} role="tablist">
      {filters.map((f) => (
        <button key={f} className={styles.btn} type="button" role="tab" aria-selected={f === value} onClick={() => onChange(f)}>
          {t(`filter.${f}`)}
        </button>
      ))}
    </div>
  );
}
