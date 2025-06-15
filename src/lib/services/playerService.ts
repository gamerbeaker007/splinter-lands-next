// playerService.ts
import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";
import { cache } from "../cache/cache";
import {
  fetchPlayerStakedAssets,
  fetchRegionDataPlayer,
} from "../api/spl/spl-land-api";
import { StakedAssets } from "@/types/stakedAssets";

export async function getCachedPlayerData(
  player: string,
  force = false,
): Promise<RawRegionDataResponse> {
  const key = `region-data:${player}`;
  if (!force) {
    const cached = cache.get<RawRegionDataResponse>(key);
    if (cached) return cached;
  }

  const data = await fetchRegionDataPlayer(player);
  cache.set(key, data);
  return data;
}

export async function getCachedStakedAssets(
  deedUid: string,
  force = false,
): Promise<StakedAssets> {
  const key = `staked-assets:${deedUid}`;
  if (!force) {
    const cached = cache.get<StakedAssets>(key);
    if (cached) return cached;
  }

  const data = await fetchPlayerStakedAssets(deedUid);
  const result: StakedAssets = {
    cards: data.cards || [],
    items: data.items || [],
  };

  cache.set(key, result);
  return result;
}
