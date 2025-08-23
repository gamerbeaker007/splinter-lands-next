"use client";

import { SplCardDetails } from "@/types/splCardDetails";
import { useEffect, useState, useCallback } from "react";

export function useCardDetails(endpoint = "/api/card-details") {
  const [cardDetails, setCardDetails] = useState<SplCardDetails[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(endpoint, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as SplCardDetails[];
      setCardDetails(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load card details.");
      setCardDetails(null);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { cardDetails, loading, error };
}
