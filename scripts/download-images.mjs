// Downloads every photo in src/data/photos.json to public/images/photos/<key>.jpg
// so the site no longer depends on the Unsplash CDN.
//
//   npm run images:download
//
// Then set  imageSource: "local"  in src/config/site.js.

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "images", "photos");
const photos = JSON.parse(await readFile(path.join(root, "src/data/photos.json"), "utf8"));
const WIDTH = 2000;

await mkdir(outDir, { recursive: true });
for (const [key, { id, by }] of Object.entries(photos)) {
  const url = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${WIDTH}&q=78&fm=jpg`;
  const res = await fetch(url);
  if (!res.ok) { console.error(`✗ ${key} (HTTP ${res.status})`); continue; }
  await writeFile(path.join(outDir, `${key}.jpg`), Buffer.from(await res.arrayBuffer()));
  console.log(`✓ ${key}.jpg  — photo by ${by}`);
}
console.log('\nDone. Set imageSource: "local" in src/config/site.js');
