import { getPlayerDashboardData } from "@/lib/backend/actions/player/dashboard-actions";
import { PlayerOverview } from "@/types/playerOverview";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

export function usePlayerDashboard(player: string) {
  const [playerOverview, setPlayerOverview] = useState<PlayerOverview | null>(
    null
  );
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Monotonically increasing id so only the most recent request may write
  // state. Guards against stale responses landing out of order when the
  // player changes while a request is still in flight.
  const requestIdRef = useRef(0);

  const fetchPlayerData = useCallback(
    async (force: boolean = false) => {
      const requestId = ++requestIdRef.current;
      const isStale = () => requestIdRef.current !== requestId;

      try {
        setLoadingText("Fetching base player data...");
        setPlayerOverview(null);

        startTransition(async () => {
          try {
            const data = await getPlayerDashboardData(player, force);
            if (isStale()) return;
            setLoadingText(null);
            setPlayerOverview(data);
          } catch (err) {
            if (isStale()) return;
            console.error("Failed to fetch data", err);
            setLoadingText("An error occurred while loading data.");
          }
        });
      } catch (err) {
        if (isStale()) return;
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
