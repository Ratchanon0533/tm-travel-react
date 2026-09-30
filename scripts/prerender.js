// Turns the single-page build into one static HTML page per language:
//   dist/index.html (default language), dist/th/index.html, dist/zh/index.html, ...
// Runs automatically at the end of `npm run build`.
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssrDir = path.join(root, "dist-ssr");

const template = await readFile(path.join(dist, "index.html"), "utf8");
const { render, languages, defaultLang } = await import(pathToFileURL(path.join(ssrDir, "entry-server.js")).href);

for (const lang of Object.keys(languages)) {
  const { html, head, htmlLang } = render(lang);
  const page = template
    .replace("<!--app-lang-->", htmlLang)
    .replace(/<title>.*?<\/title>\s*/, "")
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html);
  const outDir = lang === defaultLang ? dist : path.join(dist, lang);
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "index.html"), page);
  console.log(`  prerendered ${path.relative(root, path.join(outDir, "index.html"))}`);
}

await rm(ssrDir, { recursive: true, force: true });
