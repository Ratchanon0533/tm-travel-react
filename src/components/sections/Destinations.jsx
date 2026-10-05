import { useState } from "react";
import SectionHeading from "../ui/SectionHeading.jsx";
import DestinationFilters from "../destinations/DestinationFilters.jsx";
import DestinationCard from "../destinations/DestinationCard.jsx";
import DestinationModal from "../destinations/DestinationModal.jsx";
import { destinations } from "../../lib/content.js";
import { mosaicSpans } from "../../lib/mosaic.js";
import { useI18n } from "../../lib/i18n.jsx";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";
import styles from "./Destinations.module.css";

/** Column count — keep in sync with the breakpoints in Destinations.module.css */
function useGridColumns() {
  const lte1100 = useMediaQuery("(max-width: 1100px)");
  const lte900 = useMediaQuery("(max-width: 900px)");
  const lte600 = useMediaQuery("(max-width: 600px)");
  return lte600 ? 1 : lte900 ? 2 : lte1100 ? 3 : 4;
}

/**
 * Recommended destinations: filters + mosaic grid + detail popup.
 * Places: src/data/destinations/*.json (one file each).
 */
export default function Destinations() {
  const { t } = useI18n();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const cols = useGridColumns();

  const visible = destinations.filter((d) => filter === "all" || d.cats.includes(filter));
  const spans = mosaicSpans(visible.length, cols);
  // the popup can browse through the places currently shown
  const at = selected ? visible.indexOf(selected) : -1;
  const browse = (step) => setSelected(visible[(at + step + visible.length) % visible.length]);

  return (
    <section className={`section ${styles.destinations}`} id="destinations">
      <div className="container">
        <SectionHeading eyebrow={t("dest.eyebrow")} title={t("dest.title")} sub={t("dest.sub")} />
        <DestinationFilters value={filter} onChange={setFilter} />
        <div className={styles.grid}>
          {visible.map((d, i) => (
            // key includes the filter so cards re-mount (and replay their entrance) on filter change
            <DestinationCard key={`${filter}-${d.id}`} destination={d} span={spans[i]} index={i} onOpen={setSelected} />
          ))}
        </div>
      </div>
      <DestinationModal destination={selected} position={at >= 0 ? [at + 1, visible.length] : null} onBrowse={browse} onClose={() => setSelected(null)} />
    </section>
  );
}
