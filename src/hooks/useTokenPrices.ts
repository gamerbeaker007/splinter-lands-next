import { SplPriceData } from "@/types/price";
import { useCallback, useEffect, useState } from "react";

export function useTokenPrices() {
  const [prices, setPrices] = useState<SplPriceData | null>(null);
  const [loadingText, setLoadingText] = useState<string | null>(null);

  async function fetchSplPriceDataAPI(force: boolean): Promise<SplPriceData> {
    const res = await fetch("/api/token/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });
    return await res.json();
  }

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
    fetchSPLPriceData(false);
  }, [fetchSPLPriceData]);

  return { prices, loadingText, fetchSPLPriceData };
}
