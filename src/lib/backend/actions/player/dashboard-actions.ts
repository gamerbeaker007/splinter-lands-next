"use server";

import { getCachedPlayerOverviewData } from "@/lib/backend/services/playerService";
import { PlayerOverview } from "@/types/playerOverview";

export async function getPlayerDashboardData(
  player: string,
  force: boolean = false
): Promise<PlayerOverview> {
  return await getCachedPlayerOverviewData(encodeURIComponent(player), force);
}
