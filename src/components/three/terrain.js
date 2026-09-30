/**
 * Japan's elevation for the 3D hero map: src/data/japan-terrain.png (made by
 * scripts/build-japan-terrain.mjs from NOAA ETOPO1), decoded once in the browser.
 */
import url from "../../data/japan-terrain.png";
import info from "../../data/japan-terrain.json";

let pending;

/**
 * Resolves to { west, north, step, width, height, metres, at }:
 *  metres   Float32Array of elevations, one per grid point, rows from north to south
 *  at       (lng, lat) => elevation in metres (smoothly interpolated)
 * If the file can't be loaded the land is simply flat.
 */
export function loadTerrain() {
  pending ??= decode().catch(() => new Float32Array(info.width * info.height)).then((metres) => ({ ...info, metres, at: sampler(metres) }));
  return pending;
}

async function decode() {
  const blob = await (await fetch(url)).blob();
  // read the raw grey values (no colour correction)
  const image = await createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
  const canvas = Object.assign(document.createElement("canvas"), { width: info.width, height: info.height });
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const px = ctx.getImageData(0, 0, info.width, info.height).data;
  const metres = new Float32Array(info.width * info.height);
  // grey = 255 × √(metres / highest)
  for (let k = 0; k < metres.length; k++) metres[k] = info.maxElevation * (px[k * 4] / 255) ** 2;
  return metres;
}

function sampler(metres) {
  const { west, north, step, width, height } = info;
  return (lng, lat) => {
    const x = Math.min(Math.max((lng - west) / step, 0), width - 1.001);
    const y = Math.min(Math.max((north - lat) / step, 0), height - 1.001);
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const k = j * width + i;
    const top = metres[k] * (1 - fx) + metres[k + 1] * fx;
    const bottom = metres[k + width] * (1 - fx) + metres[k + width + 1] * fx;
    return top * (1 - fy) + bottom * fy;
  };
}
