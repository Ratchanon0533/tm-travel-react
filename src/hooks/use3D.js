import { useEffect, useState } from "react";

let supported;

/** true if the browser can draw 3D (WebGL). Checked once, with a throwaway context. */
function canUseWebGL() {
  if (supported === undefined) {
    try {
      const gl = document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl");
      supported = Boolean(gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      supported = false;
    }
  }
  return supported;
}

/**
 * Whether to show 3D: null until checked (and in the prerendered HTML), then true/false.
 * 3D scenes render only in the browser, so the first render matches on server and client,
 * and browsers without WebGL keep the plain version.
 */
export function use3D() {
  const [ok, setOk] = useState(null);
  useEffect(() => setOk(canUseWebGL()), []);
  return ok;
}
