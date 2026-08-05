"use client";

import {
  getRentedCardsList,
  type RentedCardsList,
} from "@/lib/backend/actions/land-manager/rental-actions";
import { useEffect, useMemo, useState } from "react";

interface UseRentedCardsListResult {
  data: RentedCardsList | null;
  loading: boolean;
  error: string | null;
}

export function useRentedCardsList(
  refreshToken: string
): UseRentedCardsListResult {
  const [data, setData] = useState<RentedCardsList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedToken, setCompletedToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getRentedCardsList()
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError(null);
        setCompletedToken(refreshToken);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load rentals");
        setCompletedToken(refreshToken);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const loading = useMemo(
    () => completedToken !== refreshToken,
    [completedToken, refreshToken]
  );

  return { data, loading, error };
}
