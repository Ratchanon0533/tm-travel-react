import photos from "../data/photos.json";
import { site } from "../config/site.js";
import { asset } from "./paths.js";

/** URL for a photo key from src/data/photos.json at a given width. */
export function photoUrl(key, width = 1200) {
  const photo = photos[key];
  if (!photo) throw new Error(`Unknown photo key "${key}" — add it to src/data/photos.json`);
  if (site.imageSource === "local") return asset(`images/photos/${key}.jpg`);
  return `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&w=${width}&q=75`;
}

/** Responsive srcset string (empty when serving local files). */
export function photoSrcset(key, widths = [600, 900, 1200, 1600]) {
  if (site.imageSource === "local") return undefined;
  return widths.map((w) => `${photoUrl(key, w)} ${w}w`).join(", ");
}

/** Unique list of photographers, for the footer credits. */
export function photoCredits() {
  return [...new Set(Object.values(photos).map((p) => p.by))];
}
