import { Deed, StakingDetail, WorksiteDetail } from "@/generated/prisma/client";

export type RawRegionDataResponse = {
  deeds: Deed[];
  worksite_details: WorksiteDetail[];
  staking_details: StakingDetail[];
};
