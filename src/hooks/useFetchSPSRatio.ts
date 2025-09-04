import { useEffect, useState } from "react";
import logger from "@/lib/frontend/log/logger.client";

export function useFetchSPSRatio() {
  const [spsRatio, setSpsRatio] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/region/production/sps-ratio`);

        const payload = await res.json();

        if (!res.ok) {
          const msg = payload?.error || `Request failed (${res.status})`;
          throw new Error(msg);
        }

        setSpsRatio(payload);
        return spsRatio;
      } catch (err) {
        logger.error("Failed to fetch SPS Ratio:", err);
        setError("Could not load SPS Ratio.");
        setSpsRatio(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [spsRatio]);

  return { spsRatio, loading, error };
}
