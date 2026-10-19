import photos from "../data/photos.json";
import { site } from "../config/site.js";
import { asset } from "./paths.js";

/**
 * URL for a photo key from src/data/photos.json at a given width.
 * Photos marked "local": true are our own, always served from public/images/photos/<key>.jpg (one size).
 */
export function photoUrl(key, width = 1200) {
  const photo = photos[key];
  if (!photo) throw new Error(`Unknown photo key "${key}" — add it to src/data/photos.json`);
  if (photo.local || site.imageSource === "local") return asset(`images/photos/${key}.jpg`);
  return `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&w=${width}&q=75`;
}

/** Responsive srcset string (empty when serving local files). */
export function photoSrcset(key, widths = [600, 900, 1200, 1600]) {
  if (photos[key]?.local || site.imageSource === "local") return undefined;
  return widths.map((w) => `${photoUrl(key, w)} ${w}w`).join(", ");
}

/** Unique list of Unsplash photographers, for the footer credits (our own photos are left out). */
export function photoCredits() {
  return [...new Set(Object.values(photos).filter((p) => !p.local).map((p) => p.by))];
}
