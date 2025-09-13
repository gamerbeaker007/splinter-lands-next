import { LowestMarketData } from "@/types/planner/market/market";
import { useCallback, useEffect, useState } from "react";

export function useMarketData() {
  const [marketData, setMarketData] = useState<LowestMarketData | null>(null);
  const [loadingText, setLoadingText] = useState<string | null>(null);

  async function fetchMarketDataAPI(force: boolean): Promise<LowestMarketData> {
    const res = await fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });
    return await res.json();
  }

  const fetchMarketData = useCallback(async (force: boolean = false) => {
    try {
      setLoadingText("Fetching base player data...");
      setMarketData(null);

      const data = await fetchMarketDataAPI(force);

      setLoadingText(null);
      setMarketData(data);
    } catch (err) {
      console.error("Failed to fetch data", err);
      setLoadingText("An error occurred while loading data.");
    }
  }, []);

  useEffect(() => {
    fetchMarketData(false);
  }, [fetchMarketData]);

  return { marketData, loadingText, fetchMarketData };
}
