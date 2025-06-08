import { Deed, WorksiteDetail, StakingDetail } from "@/generated/prisma";

export type DeedComplete = Deed & {
    worksiteDetail: WorksiteDetail | null;
    stakingDetail: StakingDetail | null;
};
