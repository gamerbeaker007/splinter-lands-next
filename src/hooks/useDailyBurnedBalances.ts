import { useAsyncData } from "@/hooks/useAsyncData";
import { getDailyBurnedBalances } from "@/lib/backend/actions/resources/burn-actions";
import { useMemo } from "react";

export function useDailyBurnedBalances() {
  const { data, loading, error } = useAsyncData(
    "daily-burned-balances",
    async () => (await getDailyBurnedBalances()).data,
    { errorMessage: "Failed to fetch data" }
  );
  const errorObject = useMemo(() => (error ? new Error(error) : null), [error]);

  return { data: data ?? null, loading, error: errorObject };
}
