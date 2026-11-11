import { useEffect, useState } from "react";
import { fetchFlowers } from "../api/flowers.js";

// Loads flowers from Supabase.
// status is "loading" | "success" | "error"; call retry() to load again after an error.
export function useFlowers({ limit } = {}) {
  const [state, setState] = useState({ status: "loading", flowers: [], error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false; // stops updates if the component is gone before the data arrives

    fetchFlowers({ limit })
      .then((flowers) => {
        if (!ignore) setState({ status: "success", flowers, error: null });
      })
      .catch((error) => {
        console.error("Could not load flowers:", error);
        if (!ignore) setState({ status: "error", flowers: [], error });
      });

    return () => {
      ignore = true;
    };
  }, [limit, attempt]);

  const retry = () => {
    setState((s) => ({ ...s, status: "loading" }));
    setAttempt((n) => n + 1);
  };

  return { ...state, retry };
}
