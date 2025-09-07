import { useState, useCallback } from "react";
import type { DeedComplete } from "@/types/deed";
import logger from "@/lib/frontend/log/logger.client";

export function useFetchPlot() {
  const [plot, setPlot] = useState<DeedComplete | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlot = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/plot/${id}`);

      const payload = await res.json();

      if (!res.ok) {
        const msg = payload?.error || `Request failed (${res.status})`;
        throw new Error(msg);
      }

      setPlot(payload as DeedComplete);
      return payload as DeedComplete;
    } catch (err) {
      logger.error(err);
      setError("Could not load plot.");
      setPlot(null);
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
