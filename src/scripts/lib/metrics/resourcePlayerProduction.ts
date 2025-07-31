import { Prisma } from "@/generated/prisma";
import logger from "@/lib/backend/log/logger.server";
import { prisma } from "@/lib/prisma";
import { calcCosts } from "@/lib/shared/costCalc";
import { prepareSummary } from "@/lib/backend/helpers/productionCosts";
import { computeNetValues } from "@/lib/backend/helpers/computeNetValues";
import { getResourceDECPrices } from "@/lib/backend/helpers/resourcePrices";

type PlayerProductionSummaryInput = Prisma.PlayerProductionSummaryCreateInput;

type PlayerTokenProductionRow = {
  region_uid: string;
  player: string;
  token_symbol: string;
  rewards_per_hour: number;
  total_harvest_pp: number;
  total_base_pp_after_cap: number;
  count: number;
  fee?: number;
  dec_grain?: number;
  dec_wood?: number;
  dec_stone?: number;
  dec_iron?: number;
  dec_research?: number;
  dec_aura?: number;
  dec_sps?: number;
};

export async function computeAndStorePlayerProduction(today: Date) {
  logger.info(`⌛ --- Start computeAndStorePlayerProduction...`);

  const deeds = await prisma.deed.findMany({
    include: {
      worksiteDetail: true,
      stakingDetail: true,
    },
  });

  const playerTokenMap: Record<
    string,
    Record<string, PlayerTokenProductionRow[]>
  > = {};

  for (const deed of deeds) {
    const { player, region_uid, worksiteDetail, stakingDetail } = deed;
    if (!player || !worksiteDetail || !stakingDetail) continue;
    if (worksiteDetail.token_symbol === "TAX") continue;
    if ((stakingDetail.total_harvest_pp ?? 0) <= 0) continue;

    const token = worksiteDetail.token_symbol;
    const siteEfficiency = worksiteDetail.site_efficiency ?? 0;

    const costs = calcCosts(
      token,
      stakingDetail.total_base_pp_after_cap ?? 0,
      siteEfficiency,
    );

    const row = {
      region_uid: region_uid!,
      player,
      token_symbol: token,
      rewards_per_hour: worksiteDetail.rewards_per_hour ?? 0,
      total_harvest_pp: stakingDetail.total_harvest_pp ?? 0,
      total_base_pp_after_cap: stakingDetail.total_base_pp_after_cap ?? 0,
      count: 1,
      ...costs,
    };

    if (!playerTokenMap[player]) playerTokenMap[player] = {};
    if (!playerTokenMap[player][token]) playerTokenMap[player][token] = [];

    playerTokenMap[player][token].push(row);
  }

  const unitPrices = await getResourceDECPrices();

  const playerSummaries: PlayerProductionSummaryInput[] = [];

  for (const player of Object.keys(playerTokenMap)) {
    const flatRows = Object.values(playerTokenMap[player]).flat();

    const summary = prepareSummary(flatRows, true, true);
    const { dec_net, total_dec } = computeNetValues(summary, unitPrices);

    const total_harvest_pp = flatRows.reduce(
      (sum, r) => sum + r.total_harvest_pp,
      0,
    );
    const total_base_pp_after_cap = flatRows.reduce(
      (sum, r) => sum + r.total_base_pp_after_cap,
      0,
    );
    const count = flatRows.reduce((sum, r) => sum + r.count, 0);

    playerSummaries.push({
      player,
      total_harvest_pp,
      total_base_pp_after_cap,
      count,
      total_dec,
      dec_grain: dec_net.dec_grain || 0,
      dec_wood: dec_net.dec_wood || 0,
      dec_stone: dec_net.dec_stone || 0,
      dec_iron: dec_net.dec_iron || 0,
      dec_research: dec_net.dec_research || 0,
      dec_aura: dec_net.dec_aura || 0,
      dec_sps: dec_net.dec_sps || 0,
    });
  }

  logger.info(`🧹 playerProductionSummary - Clearing existing data...`);
  await prisma.playerProductionSummary.deleteMany();

  logger.info(`📦 Inserting ${playerSummaries.length} playerSummaries...`);
  await prisma.playerProductionSummary.createMany({
    data: playerSummaries,
  });

  logger.info(
    `✅ Stored player production for ${today.toISOString().split("T")[0]}`,
  );
}
