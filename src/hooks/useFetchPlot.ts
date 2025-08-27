import { DeedComplete } from "@/types/deed";
import { useState, useCallback } from "react";

export function useFetchPlot() {
  const [plot, setPlot] = useState<DeedComplete | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlot = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    setPlot(null);

    try {
      const res = await fetch(`/api/plot/${id}`);

      if (!res.ok) {
        setPlot(null);
        if (res.status === 404) {
          setError("Invalid plot id");
        } else if (res.status === 400) {
          setError("Plot not found");
        } else {
          throw new Error("Unexpected error. Please try again.");
        }
        return null;
      }

      const payload = await res.json();
      setPlot(payload as DeedComplete);
      return payload as DeedComplete;
    } catch (e) {
      setError((e as Error).message || "Could not load plot.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = () => {
    setPlot(null);
    setError(null);
  };

  return { plot, loading, error, fetchPlot, reset };
}
