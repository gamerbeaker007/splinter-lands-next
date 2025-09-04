"use client";

import { SplCardDetails } from "@/types/splCardDetails";
import { useEffect, useState } from "react";

export function useCardDetails() {
  const [cardDetails, setCardDetails] = useState<SplCardDetails[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/card-details", {
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
    })();
  }, []);

  return { cardDetails, loading, error };
}
