import { getPlotById } from "@/lib/backend/actions/plot-actions";
import logger from "@/lib/frontend/log/logger.client";
import type { DeedComplete } from "@/types/deed";
import { useCallback, useState } from "react";

export function useFetchPlot() {
  const [plot, setPlot] = useState<DeedComplete | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlot = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const payload = await getPlotById(id);

      setPlot(payload);
      return payload;
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
