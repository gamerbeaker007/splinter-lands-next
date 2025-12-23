import { getPlayerDashboardData } from "@/lib/backend/actions/player/dashboard-actions";
import { PlayerOverview } from "@/types/playerOverview";
import { useCallback, useEffect, useState, useTransition } from "react";

export function usePlayerDashboard(player: string) {
  const [playerOverview, setPlayerOverview] = useState<PlayerOverview | null>(
    null
  );
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchPlayerData = useCallback(
    async (force: boolean = false) => {
      try {
        setLoadingText("Fetching base player data...");
        setPlayerOverview(null);

        startTransition(async () => {
          try {
            const data = await getPlayerDashboardData(player, force);
            setLoadingText(null);
            setPlayerOverview(data);
          } catch (err) {
            console.error("Failed to fetch data", err);
            setLoadingText("An error occurred while loading data.");
          }
        });
      } catch (err) {
        console.error("Failed to fetch data", err);
        setLoadingText("An error occurred while loading data.");
      }
    },
    [player]
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

  return { playerOverview, loadingText, fetchPlayerData, isPending };
}
