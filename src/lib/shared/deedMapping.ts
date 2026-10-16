import { DeedComplete } from "@/types/deed";
import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";

/** Joins each deed with its worksite and staking detail rows. */
export function mapRegionDataToDeedComplete(
  data: RawRegionDataResponse
): DeedComplete[] {
  if (Object.entries(data.deeds).length === 0) return [];

  const worksiteMap = new Map(
    data.worksite_details.map((w) => [w.deed_uid, w])
  );
  const stakingMap = new Map(data.staking_details.map((s) => [s.deed_uid, s]));
  return data.deeds.map((deed) => ({
    ...deed,
    worksiteDetail: worksiteMap.get(deed.deed_uid) || null,
    stakingDetail: stakingMap.get(deed.deed_uid) || null,
  }));
}
