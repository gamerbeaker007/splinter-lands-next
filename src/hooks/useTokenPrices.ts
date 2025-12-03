"use client";
import { SplPriceData } from "@/types/price";
import { useCallback, useEffect, useState } from "react";

interface useTokenPricesReturn {
  prices: SplPriceData | null;
  loadingText: string | null;
  fetchSPLPriceData: () => Promise<void>;
}

async function fetchSplPriceDataAPI(force: boolean): Promise<SplPriceData> {
  const res = await fetch("/api/token/prices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ force }),
  });
  return await res.json();
}

export function useTokenPrices(): useTokenPricesReturn {
  const [prices, setPrices] = useState<SplPriceData | null>(null);
  const [loadingText, setLoadingText] = useState<string | null>(null);

  const fetchSPLPriceData = useCallback(async (force: boolean = false) => {
    try {
      setLoadingText("Fetching base player data...");
      setPrices(null);

      const data = await fetchSplPriceDataAPI(force);

      setLoadingText(null);
      setPrices(data);
    } catch (err) {
      console.error("Failed to fetch data", err);
      setLoadingText("An error occurred while loading data.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchSPLPriceData(false);
    })();
  }, [fetchSPLPriceData]);

  return { prices, loadingText, fetchSPLPriceData };
}
