import { useEffect } from "react";
import { useLocation } from "react-router";

// After moving to another page: scroll to the top,
// or to a section if the link has one (e.g. "/#bespoke").
// A link can ask to stay where it is with state { keepScroll: true }
// (e.g. choosing another colour on the flower page).
export default function ScrollManager() {
  const { pathname, hash, state } = useLocation();
  const keepScroll = Boolean(state?.keepScroll);

  useEffect(() => {
    if (keepScroll) return;
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, keepScroll]);

  return null;
}
