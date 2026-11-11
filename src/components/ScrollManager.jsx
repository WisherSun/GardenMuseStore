import { useEffect } from "react";
import { useLocation } from "react-router";

// After moving to another page: scroll to the top,
// or to a section if the link has one (e.g. "/#botanicals").
export default function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}
