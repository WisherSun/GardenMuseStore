import { useLayoutEffect } from "react";

// Fades sections in (opacity 0 -> 1) the first time they scroll into view.
// `containerRef` points at the element whose direct <section> children should fade.
// The look is in index.css (.reveal / .is-visible).
//
// - The first section (top of the page) fades in straight away.
// - The others wait until their top edge comes up into the screen while scrolling.
// - Once shown, a section stays shown (scrolling back up doesn't hide it again).
// - People who turned on "reduce motion" in their system settings get no fading at all.
//
// Why not check right when the page opens: photos that are still loading take up
// no space, so for a moment the whole page is short and every section looks "on
// screen" — they would all fade in at once. So the first check waits until the page
// has finished loading; after that, only scrolling (or resizing) shows sections.

const SHOW_AT = 0.85; // a section shows when its top edge is above 85% of the screen height

export function useRevealOnScroll(containerRef) {
  // Layout effect: the sections are hidden before the browser paints them,
  // so nothing flashes on screen and then disappears.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = [...container.querySelectorAll(":scope > section")];
    if (sections.length === 0) return;

    for (const section of sections) section.classList.add("reveal");
    sections[0].classList.add("is-visible");
    let hidden = sections.slice(1);

    let frame = 0;
    const check = () => {
      frame = 0;
      const line = window.innerHeight * SHOW_AT;
      hidden = hidden.filter((section) => {
        if (section.getBoundingClientRect().top > line) return true; // still below: keep waiting
        section.classList.add("is-visible");
        return false;
      });
      if (hidden.length === 0) stopListening();
    };

    // Scroll fires many times a second; check at most once per screen refresh
    const scheduleCheck = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };

    const startListening = () => {
      window.addEventListener("scroll", scheduleCheck, { passive: true });
      window.addEventListener("resize", scheduleCheck);
      scheduleCheck(); // sections already on screen after loading (tall screens) show now
    };

    function stopListening() {
      window.removeEventListener("load", startListening);
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
      cancelAnimationFrame(frame);
      frame = 0;
    }

    // Coming from another page of the site the page is usually loaded already;
    // on the very first visit wait for the photos.
    if (document.readyState === "complete") startListening();
    else window.addEventListener("load", startListening, { once: true });

    return () => {
      stopListening();
      for (const section of sections) section.classList.remove("reveal", "is-visible");
    };
  }, [containerRef]);
}
