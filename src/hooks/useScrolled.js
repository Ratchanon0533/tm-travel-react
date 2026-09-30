import { useEffect, useState } from "react";

/** true once the page is scrolled past `threshold` px (or a function returning px). */
export function useScrolled(threshold = 60) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const limit = () => (typeof threshold === "function" ? threshold() : threshold);
    const onScroll = () => setScrolled(window.scrollY > limit());
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}
