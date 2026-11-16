import { useLayoutEffect } from "react";

// Fades sections in (opacity 0 -> 1) the first time they scroll into view.
// `containerRef` points at the element whose direct <section> children should fade.
// The look is in index.css (.reveal / .is-visible).
//
// - Sections that are already on screen when the page opens fade in straight away.
// - Once shown, a section stays shown (scrolling back up doesn't hide it again).
// - People who turned on "reduce motion" in their system settings get no fading at all,
//   and so does a browser without IntersectionObserver: everything is simply visible.
export function useRevealOnScroll(containerRef) {
  // Layout effect: the sections are hidden before the browser paints them,
  // so nothing flashes on screen and then disappears.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = [...container.querySelectorAll(":scope > section")];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // shown once is enough
        }
      },
      // starts when about 10% of the section is on screen, a bit above the bottom edge
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );

    for (const section of sections) {
      section.classList.add("reveal");
      observer.observe(section);
    }

    return () => {
      observer.disconnect();
      for (const section of sections) section.classList.remove("reveal", "is-visible");
    };
  }, [containerRef]);
}
