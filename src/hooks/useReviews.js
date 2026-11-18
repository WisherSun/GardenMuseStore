import { useCallback, useEffect, useState } from "react";
import { fetchReviews } from "../api/reviews.js";

// Loads the reviews of a flower. `idsKey` = the ids of all its colours joined with commas
// (or just its own id). status: "loading" | "success" | "error"; reload() fetches them again.
// Also returns the average mark (e.g. 4.5) and the count, for the rating next to the name.
export function useReviews(idsKey) {
  const [state, setState] = useState({ status: "loading", reviews: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    fetchReviews(idsKey.split(",").map(Number))
      .then((reviews) => {
        if (!ignore) setState({ status: "success", reviews });
      })
      .catch((error) => {
        console.error("Could not load reviews:", error);
        if (!ignore) setState({ status: "error", reviews: [] });
      });
    return () => {
      ignore = true;
    };
  }, [idsKey, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const count = state.reviews.length;
  // Rounded to one decimal: marks 4 and 5 give 4.5
  const average = count
    ? Math.round((state.reviews.reduce((sum, r) => sum + r.mark, 0) / count) * 10) / 10
    : 0;

  return { ...state, count, average, reload };
}
