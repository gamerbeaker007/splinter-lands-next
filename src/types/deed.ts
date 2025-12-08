import { Deed, WorksiteDetail, StakingDetail } from "@/generated/prisma/client";
import { StakedAssets } from "./stakedAssets";
import { ProgressInfo } from "./progressInfo";
import { ProductionInfo } from "@/types/productionInfo";

export type DeedComplete = Deed & {
  worksiteDetail: WorksiteDetail | null;
  stakingDetail: StakingDetail | null;
  stakedAssets?: StakedAssets;
  progressInfo?: ProgressInfo;
  productionInfo?: ProductionInfo;
};
