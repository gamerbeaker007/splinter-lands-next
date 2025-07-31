// hooks/usePrices.ts
import { useState, useEffect, useCallback } from "react";
import { Prices } from "@/types/price";

export function usePrices() {
  const [prices, setPrices] = useState<Prices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/resource/prices`);
      const data = await res.json();
      setPrices(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch prices:", err);
      setError("Could not load prices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchPrices();
    })();
  }, [fetchPrices]);

  return { prices, loading, error, fetchPrices };
}
