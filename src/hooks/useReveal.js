import { useEffect } from "react";

/**
 * Fades in every element with className="reveal" as it scrolls into view, by giving it a
 * data-revealed attribute (an attribute, not a class: React re-rendering a className would wipe a
 * class it doesn't know about and hide the element again). Elements added later are picked up too.
 */
export function useReveal() {
  useEffect(() => {
    const show = (el) => { el.dataset.revealed = ""; };
    const pending = (root) => [
      ...(root.matches?.(".reveal:not([data-revealed])") ? [root] : []),
      ...(root.querySelectorAll?.(".reveal:not([data-revealed])") ?? []),
    ];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!("IntersectionObserver" in window) || reduce) {
      pending(document).forEach(show);
      const mo = new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach((n) => pending(n).forEach(show))));
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            show(e.target);
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    pending(document).forEach((el) => io.observe(el));
    const mo = new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach((n) => pending(n).forEach((el) => io.observe(el)))));
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
