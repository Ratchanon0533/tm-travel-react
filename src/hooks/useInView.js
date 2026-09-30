import { useEffect, useState } from "react";

/** true while the element in `ref` is on screen (with a `margin` head start). Used to pause 3D scenes off screen. */
export function useInView(ref, margin = "150px") {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return inView;
}
