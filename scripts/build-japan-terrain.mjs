// Downloads Japan's elevation from NOAA ETOPO1 (public domain, 1 arc-minute ≈ 1.8 km) and saves it
// as a small greyscale height map used by the 3D hero map:
//
//   node scripts/build-japan-terrain.mjs   →   src/data/japan-terrain.png + japan-terrain.json
//
// Run scripts/build-japan-map.mjs first if you change the coastline (the terrain covers the same area).
// Only land (plus a thin margin) is kept; the sea and neighbouring countries are left at 0.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { crc32, deflateSync } from "node:zlib";
import path from "node:path";

const STRIDE = 1; // 1 = full ETOPO1 detail (1 arc-minute) · 2 = half the detail, ~¼ of the file size
const PAD = 0.2; // degrees of margin around the coastline
const MARGIN = 3; // grid cells of elevation kept outside the coastline (so the edge slopes naturally)
const SMOOTH = 1; // softening passes (0 = raw data, crisper but noisier relief)
const SOURCE = "https://coastwatch.pfeg.noaa.gov/erddap/griddap/etopo180.esriAscii";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const map = JSON.parse(await readFile(path.join(root, "src/data/japan-map.json"), "utf8"));

// Area to download: the coastline's bounding box, snapped to the 1-minute grid
const snap = (n, round) => round(n * 60) / 60;
const points = map.islands.flat();
const west = snap(Math.min(...points.map((p) => p[0])) - PAD, Math.floor);
const east = snap(Math.max(...points.map((p) => p[0])) + PAD, Math.ceil);
const south = snap(Math.min(...points.map((p) => p[1])) - PAD, Math.floor);
const north = snap(Math.max(...points.map((p) => p[1])) + PAD, Math.ceil);

const url = `${SOURCE}?altitude%5B(${south}):${STRIDE}:(${north})%5D%5B(${west}):${STRIDE}:(${east})%5D`;
console.log(`Downloading ETOPO1 ${west.toFixed(2)}–${east.toFixed(2)}°E, ${south.toFixed(2)}–${north.toFixed(2)}°N …`);
const res = await fetch(url);
if (!res.ok) throw new Error(`ETOPO download failed: ${res.status} ${res.statusText}`);
const text = await res.text();

// ESRI ASCII grid: 6 header lines, then rows of metres from north to south
const lines = text.trim().split(/\r?\n/);
const header = Object.fromEntries(lines.slice(0, 6).map((l) => { const [k, v] = l.trim().split(/\s+/); return [k.toLowerCase(), Number(v)]; }));
const width = header.ncols;
const height = header.nrows;
const step = header.cellsize;
const x0 = header.xllcenter; // longitude of the first column
const y0 = header.yllcenter + (height - 1) * step; // latitude of the first (northern) row
const metres = new Float32Array(width * height);
lines.slice(6).forEach((line, j) => line.trim().split(/\s+/).forEach((v, i) => { metres[j * width + i] = Number(v); }));

// Soften: the sea counts as sea level, then a small blur ([1 2 1] across and down) per pass
for (let k = 0; k < metres.length; k++) metres[k] = Math.max(0, metres[k]);
for (let pass = 0; pass < SMOOTH; pass++) {
  const tmp = new Float32Array(metres.length);
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const k = j * width + i;
      tmp[k] = (metres[k - (i > 0)] + 2 * metres[k] + metres[k + (i < width - 1)]) / 4;
    }
  }
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const k = j * width + i;
      metres[k] = (tmp[k - (j > 0) * width] + 2 * tmp[k] + tmp[k + (j < height - 1) * width]) / 4;
    }
  }
}

// Land mask from the coastline (scanline fill), grown by MARGIN cells
const land = new Uint8Array(width * height);
const edges = map.islands.flatMap((ring) => ring.map((p, k) => [p, ring[(k + 1) % ring.length]]));
for (let j = 0; j < height; j++) {
  const lat = y0 - j * step;
  const xs = [];
  for (const [[x1, y1], [x2, y2]] of edges) {
    if ((y1 <= lat && lat < y2) || (y2 <= lat && lat < y1)) xs.push(x1 + ((lat - y1) * (x2 - x1)) / (y2 - y1));
  }
  xs.sort((a, b) => a - b);
  for (let k = 0; k + 1 < xs.length; k += 2) {
    const from = Math.max(0, Math.ceil((xs[k] - x0) / step));
    const to = Math.min(width - 1, Math.floor((xs[k + 1] - x0) / step));
    for (let i = from; i <= to; i++) land[j * width + i] = 1;
  }
}
// also mark the cells the coastline passes through (tiny islands narrower than a cell)
for (const [lng, lat] of points) land[Math.round((y0 - lat) / step) * width + Math.round((lng - x0) / step)] = 1;
const keep = new Uint8Array(width * height);
for (let j = 0; j < height; j++) {
  for (let i = 0; i < width; i++) {
    if (!land[j * width + i]) continue;
    for (let dj = -MARGIN; dj <= MARGIN; dj++) {
      for (let di = -MARGIN; di <= MARGIN; di++) {
        const jj = j + dj, ii = i + di;
        if (jj >= 0 && jj < height && ii >= 0 && ii < width) keep[jj * width + ii] = 1;
      }
    }
  }
}

// Encode: grey = 255 × √(metres / highest); the square root keeps more detail in the lowlands
let maxElevation = 0;
for (let k = 0; k < metres.length; k++) if (keep[k]) maxElevation = Math.max(maxElevation, metres[k]);
maxElevation = Math.ceil(maxElevation);
const grey = new Uint8Array(width * height);
for (let k = 0; k < metres.length; k++) {
  if (keep[k] && metres[k] > 0) grey[k] = Math.round(255 * Math.sqrt(metres[k] / maxElevation));
}

await writeFile(path.join(root, "src/data/japan-terrain.png"), encodePng(width, height, grey));
await writeFile(
  path.join(root, "src/data/japan-terrain.json"),
  JSON.stringify({ source: "NOAA ETOPO1 (public domain)", west: x0, north: y0, step, width, height, maxElevation, encoding: "sqrt" }, null, 2) + "\n",
);
console.log(`✓ src/data/japan-terrain.png — ${width}×${height}, highest point ${maxElevation} m`);

/** Minimal 8-bit greyscale PNG encoder (picks the best filter for each row) */
function encodePng(w, h, pixels) {
  const raw = Buffer.alloc((w + 1) * h);
  const row = Buffer.alloc(w);
  for (let y = 0; y < h; y++) {
    const cur = pixels.subarray(y * w, (y + 1) * w);
    const up = y ? pixels.subarray((y - 1) * w, y * w) : new Uint8Array(w);
    let best = null;
    for (let f = 0; f <= 4; f++) {
      let sum = 0;
      for (let x = 0; x < w; x++) {
        const a = x ? cur[x - 1] : 0, b = up[x], c = x ? up[x - 1] : 0;
        const pred = [0, a, b, (a + b) >> 1, paeth(a, b, c)][f];
        row[x] = (cur[x] - pred) & 255;
        sum += row[x] < 128 ? row[x] : 256 - row[x];
      }
      if (!best || sum < best.sum) best = { f, sum, bytes: Buffer.from(row) };
    }
    raw[y * (w + 1)] = best.f;
    best.bytes.copy(raw, y * (w + 1) + 1);
  }
  const chunk = (type, data) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, "ascii");
    data.copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // greyscale
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
