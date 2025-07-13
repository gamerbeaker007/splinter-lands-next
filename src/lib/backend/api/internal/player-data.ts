import { filterDeeds } from "@/lib/filters";
import { getCachedPlayerData } from "@/lib/backend/services/playerService";
import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";
import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";

function mapRegionDataToDeedComplete(
  data: RawRegionDataResponse,
): DeedComplete[] {
  const worksiteMap = new Map(
    data.worksite_details.map((w) => [w.deed_uid, w]),
  );
  const stakingMap = new Map(data.staking_details.map((s) => [s.deed_uid, s]));
  return data.deeds.map((deed) => ({
    ...deed,
    worksiteDetail: worksiteMap.get(deed.deed_uid) || null,
    stakingDetail: stakingMap.get(deed.deed_uid) || null,
  }));
}

export async function getPlayerData(
  player: string,
  filters: FilterInput,
  force = false,
): Promise<DeedComplete[]> {
  const raw = await getCachedPlayerData(player, force);
  console.log(`Filters: ${JSON.stringify(filters)}`);
  if (raw.deeds.length > 0) {
    const completeDeeds = mapRegionDataToDeedComplete(raw);
    return filterDeeds(completeDeeds, filters);
  }
  return [];
}
