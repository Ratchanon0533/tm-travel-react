import { useEffect, useRef } from "react";

/**
 * 3D tilt toward the mouse. Returns a ref for the element; it sets --rx / --ry (rotation)
 * and --gx / --gy (pointer position, for a glare highlight) for the CSS to use.
 * Off on touch screens and with "reduce motion".
 */
export function useTilt(maxDeg = 6) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const set = (rx, ry, gx, gy) => {
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      el.style.setProperty("--gx", `${gx.toFixed(1)}%`);
      el.style.setProperty("--gy", `${gy.toFixed(1)}%`);
    };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width; // 0 … 1
      const y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => set((0.5 - y) * maxDeg, (x - 0.5) * maxDeg, x * 100, y * 100));
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      set(0, 0, 50, 50);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [maxDeg]);
  return ref;
}
