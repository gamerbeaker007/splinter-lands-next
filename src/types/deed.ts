import { Deed, WorksiteDetail, StakingDetail } from "@/generated/prisma";
import { StakedAssets } from "./stakedAssets";
import { ProgressInfo } from "./progressInfo";

export type DeedComplete = Deed & {
  worksiteDetail: WorksiteDetail | null;
  stakingDetail: StakingDetail | null;
  stakedAssets?: StakedAssets;
  progressInfo?: ProgressInfo;
};
