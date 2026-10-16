"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { getRentedCardsList } from "@/lib/frontend/land-production-data";
import type { RentedCardsList } from "@/lib/shared/rentals";

interface UseRentedCardsListResult {
  data: RentedCardsList | null;
  loading: boolean;
  error: string | null;
}

export function useRentedCardsList(
  refreshToken: string
): UseRentedCardsListResult {
  const { data, loading, error } = useAsyncData(
    `rented-cards|${refreshToken}`,
    () => getRentedCardsList(),
    { errorMessage: "Failed to load rentals" }
  );
  return { data: data ?? null, loading, error };
}
