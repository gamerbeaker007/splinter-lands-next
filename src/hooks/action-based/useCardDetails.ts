"use client";

import { getCardDetails } from "@/lib/backend/actions/card-detail-actions";
import { SplCardDetails } from "@/types/splCardDetails";
import { useEffect, useState } from "react";

export function useCardDetailsAction() {
  const [cardDetails, setCardDetails] = useState<SplCardDetails[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCardDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCardDetails();
        setCardDetails(data);
      } catch (err) {
        console.error("Failed to fetch card details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load card details"
        );
        setCardDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCardDetails();
  }, []);

  return { cardDetails, loading, error };
}
