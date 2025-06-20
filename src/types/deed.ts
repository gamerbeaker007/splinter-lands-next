import { Deed, WorksiteDetail, StakingDetail } from "@/generated/prisma";
import { StakedAssets } from "./stakedAssets";

export type DeedComplete = Deed & {
  worksiteDetail: WorksiteDetail | null;
  stakingDetail: StakingDetail | null;
  stakedAssets?: StakedAssets;
};
