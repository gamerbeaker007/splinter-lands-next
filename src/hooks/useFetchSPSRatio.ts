import { useCallback, useEffect, useState } from "react";

export function useFetchSPSRatio() {
  const [spsRatio, setSpsRatio] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSPSRatio = useCallback(async () => {
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
      console.error("Failed to fetch plot:", err);
      setError("Could not load plot.");
      setSpsRatio(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = () => {
    setSpsRatio(null);
    setError(null);
  };

  useEffect(() => {
    (async () => {
      await fetchSPSRatio();
    })();
  }, [fetchSPSRatio]);

  return { spsRatio, loading, error, fetchSPSRatio, reset };
}
