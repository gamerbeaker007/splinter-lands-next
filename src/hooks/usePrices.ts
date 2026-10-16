// hooks/usePrices.ts
import { useAsyncData } from "@/hooks/useAsyncData";
import { getActualResourcePrices } from "@/lib/backend/actions/resources/prices-actions";

export function usePrices() {
  const { data, loading, error, refetch } = useAsyncData(
    "resource-prices",
    () => getActualResourcePrices(),
    { errorMessage: "Could not load prices." }
  );

  return {
    prices: data ?? null,
    loading,
    error: error ? "Could not load prices." : null,
    fetchPrices: refetch,
  };
}
