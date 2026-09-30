// Extracts Japan's coastline from the Natural Earth world map (public domain, via the
// world-atlas package) into a small file used by the 3D hero map:
//
//   node scripts/build-japan-map.mjs   →   src/data/japan-map.json
//
// Only needs to run again if you want a different level of detail (see the settings below).
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { feature } from "topojson-client";

const RESOLUTION = "50m"; // "110m" (coarse) · "50m" · "10m" (very detailed, much larger)
const MIN_AREA = 0.004; // drop islands smaller than this (square degrees, ~40 km²)
const MIN_STEP = 0.04; // drop coastline points closer than this to the previous one (degrees)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const world = JSON.parse(await readFile(require.resolve(`world-atlas/countries-${RESOLUTION}.json`), "utf8"));
const japan = feature(world, world.objects.countries).features.find((f) => f.properties.name === "Japan");
if (!japan) throw new Error("Japan not found in world-atlas");

const polygons = japan.geometry.type === "Polygon" ? [japan.geometry.coordinates] : japan.geometry.coordinates;
const area = (ring) => Math.abs(ring.reduce((s, [x1, y1], i) => { const [x2, y2] = ring[(i + 1) % ring.length]; return s + x1 * y2 - x2 * y1; }, 0) / 2);
const round = (n) => Math.round(n * 100) / 100;

const islands = polygons
  .map((poly) => poly[0]) // outer ring only
  .filter((ring) => area(ring) >= MIN_AREA)
  .map((ring) => {
    const out = [];
    for (const [lon, lat] of ring) {
      const last = out[out.length - 1];
      if (!last || Math.hypot(lon - last[0], lat - last[1]) >= MIN_STEP) out.push([round(lon), round(lat)]);
    }
    return out;
  })
  .filter((ring) => ring.length >= 4)
  .sort((a, b) => area(b) - area(a));

await writeFile(path.join(root, "src/data/japan-map.json"), JSON.stringify({ source: `Natural Earth ${RESOLUTION} (public domain)`, islands }));
console.log(`✓ src/data/japan-map.json — ${islands.length} islands, ${islands.reduce((n, r) => n + r.length, 0)} points`);
