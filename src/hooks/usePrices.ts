// hooks/usePrices.ts
import { getActualResourcePrices } from "@/lib/backend/actions/resources/prices-actions";
import { Prices } from "@/types/price";
import { useCallback, useEffect, useState } from "react";

export function usePrices() {
  const [prices, setPrices] = useState<Prices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getActualResourcePrices();
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
