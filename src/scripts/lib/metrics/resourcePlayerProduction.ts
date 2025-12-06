import { Prisma } from "@/generated/prisma";
import { computeNetValues } from "@/lib/backend/helpers/computeNetValues";
import { prepareSummary } from "@/lib/backend/helpers/productionCosts";
import { getResourceDECPrices } from "@/lib/backend/helpers/resourcePrices";
import logger from "@/lib/backend/log/logger.server";
import { prisma } from "@/lib/prisma";

type PlayerProductionSummaryInput = Prisma.PlayerProductionSummaryCreateInput;

export async function computeAndStorePlayerProduction(today: Date) {
  logger.info(`⌛ --- Start computeAndStorePlayerProduction...`);

  const deeds = await prisma.deed.findMany({
    include: {
      worksiteDetail: true,
      stakingDetail: true,
    },
  });

  const unitPrices = await getResourceDECPrices();

  const playerSummaries: PlayerProductionSummaryInput[] = [];

  const uniquePlayers: Set<string> = new Set(deeds.map((d) => d.player!));

  for (const player of uniquePlayers) {
    // const flatRows = Object.values(playerTokenMap[player]).flat();
    const flatRows = deeds.filter((d) => d.player === player).flat();

    const summary = prepareSummary(flatRows, true, true);
    const { dec_net, total_dec } = computeNetValues(summary, unitPrices);

    const total_harvest_pp = flatRows.reduce(
      (sum, r) => sum + (r.stakingDetail?.total_harvest_pp ?? 0),
      0
    );
    const total_base_pp_after_cap = flatRows.reduce(
      (sum, r) => sum + (r.stakingDetail?.total_base_pp_after_cap ?? 0),
      0
    );
    const count = flatRows.length;

    playerSummaries.push({
      player,
      total_harvest_pp,
      total_base_pp_after_cap,
      count,
      total_dec,
      dec_grain: dec_net.GRAIN || 0,
      dec_wood: dec_net.WOOD || 0,
      dec_stone: dec_net.STONE || 0,
      dec_iron: dec_net.IRON || 0,
      dec_research: dec_net.RESEARCH || 0,
      dec_aura: dec_net.AURA || 0,
      dec_sps: dec_net.SPS || 0,
    });
  }

  logger.info(`🧹 playerProductionSummary - Clearing existing data...`);
  await prisma.playerProductionSummary.deleteMany();

  logger.info(`📦 Inserting ${playerSummaries.length} playerSummaries...`);
  await prisma.playerProductionSummary.createMany({
    data: playerSummaries,
  });

  logger.info(
    `✅ Stored player production for ${today.toISOString().split("T")[0]}`
  );
}
