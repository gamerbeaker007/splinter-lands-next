import { PlayerOverview } from "@/types/playerOverview";
import { useState, useCallback, useEffect } from "react";

export function usePlayerDashboard(player: string) {
  const [playerOverview, setPlayerOverview] = useState<PlayerOverview | null>(
    null,
  );
  const [loadingText, setLoadingText] = useState<string | null>(null);

  async function fetchPlayerDashboardData(
    player: string,
    force: boolean,
  ): Promise<PlayerOverview> {
    const res = await fetch("/api/player/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player, force }),
    });
    return await res.json();
  }

  const fetchPlayerData = useCallback(
    async (force: boolean = false) => {
      try {
        setLoadingText("Fetching base player data...");
        setPlayerOverview(null);

        const data = await fetchPlayerDashboardData(player, force);

        setLoadingText(null);
        setPlayerOverview(data);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setLoadingText("An error occurred while loading data.");
      }
    },
    [player],
  );

  useEffect(() => {
    (async () => {
      if (!player || player === "") {
        setLoadingText(null);
        return;
      }

      await fetchPlayerData(false);
    })();
  }, [player, fetchPlayerData]);

  return { playerOverview, loadingText, fetchPlayerData };
}
