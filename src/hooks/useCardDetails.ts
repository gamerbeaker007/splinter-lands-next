"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { getCardDetails } from "@/lib/backend/actions/card-detail-actions";

export function useCardDetailsAction() {
  const { data, loading, error } = useAsyncData(
    "card-details",
    () => getCardDetails(),
    { errorMessage: "Failed to load card details" }
  );

  return { cardDetails: data ?? null, loading, error };
}
