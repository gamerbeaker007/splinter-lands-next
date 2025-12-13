import { getDailyBurnedBalances } from "@/lib/backend/actions/resources/burn-actions";
import { BurnCardsDataPoint } from "@/types/burn";
import { useEffect, useState } from "react";

export function useDailyBurnedBalances() {
  const [data, setData] = useState<BurnCardsDataPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await getDailyBurnedBalances();
        setData(result.data);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch data")
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { data, loading, error };
}
