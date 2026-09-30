/**
 * Loads the content files in src/data/.
 * Destinations: one JSON file per place in src/data/destinations/ —
 * add a file to add a place, sort with `order`, set "hidden": true to hide one.
 */
import hero from "../data/hero.json";
import seasons from "../data/seasons.json";
import experiences from "../data/experiences.json";
import filters from "../data/filters.json";
import features from "../data/features.json"; // text values are i18n keys
import steps from "../data/steps.json"; // text values are i18n keys

const destinationFiles = import.meta.glob("../data/destinations/*.json", { eager: true, import: "default" });

export const destinations = Object.values(destinationFiles)
  .filter((d) => !d.hidden)
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

export { hero, seasons, experiences, filters, features, steps };
