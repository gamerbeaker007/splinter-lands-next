import { Prisma } from "@/generated/prisma";
import logger from "@/lib/backend/log/logger.server";
import { prisma } from "@/lib/prisma";
import { calcCosts } from "@/lib/shared/costCalc";
import { prepareSummary } from "@/lib/backend/helpers/productionCosts";
import { computeNetValues } from "@/lib/backend/helpers/computeNetValues";
import { getResourceDECPrices } from "@/lib/backend/helpers/resourcePrices";

type PlayerProductionSummaryInput = Prisma.PlayerProductionSummaryCreateInput;

type regionPlayerTokenResult = {
  region_uid: string;
  player: string;
  token_symbol: string;
  rewards_per_hour: number;
  total_harvest_pp: number;
  total_base_pp_after_cap: number;
  count: number;
};

export async function computeAndStorePlayerProduction(today: Date) {
  logger.info(`⌛ --- Start computeAndStorePlayerProduction...`);

  const rawResults = await prisma.$queryRaw<regionPlayerTokenResult[]>`
  SELECT
    d.region_uid,
    d.player,
    w.token_symbol,
    SUM(w.rewards_per_hour) AS rewards_per_hour,
    SUM(s.total_harvest_pp) AS total_harvest_pp,
    SUM(s.total_base_pp_after_cap) AS total_base_pp_after_cap,
    COUNT(*) AS count
  FROM "deed" d
  JOIN "worksite_detail" w ON d.deed_uid = w.deed_uid
  JOIN "staking_detail" s ON d.deed_uid = s.deed_uid
  WHERE s.total_harvest_pp > 0 AND w.token_symbol != 'TAX'
  GROUP BY d.region_uid, d.player, w.token_symbol;
`;

  const resultsWithCosts = rawResults.map((row: regionPlayerTokenResult) => {
    const costs = calcCosts(row.token_symbol, row.total_base_pp_after_cap);

    return {
      ...row,
      ...costs,
    };
  });

  const unitPrices = await getResourceDECPrices();

  const playerMap: Record<string, typeof resultsWithCosts> = {};

  for (const row of resultsWithCosts) {
    if (!playerMap[row.player]) {
      playerMap[row.player] = [];
    }
    playerMap[row.player].push(row);
  }

  // Compute summary for each player
  const playerSummaries: PlayerProductionSummaryInput[] = [];

  for (const player of Object.keys(playerMap)) {
    const playerRows = playerMap[player];
    const summary = prepareSummary(playerRows, true, true); // includeTaxes, includeFee

    const { dec_net, total_dec } = computeNetValues(summary, unitPrices);

    // === Aggregate sums from raw playerRows ===
    const harvest_sum = playerRows.reduce(
      (acc: number, row: regionPlayerTokenResult) =>
        acc + (row.total_harvest_pp as number),
      0,
    );
    const base_sum = playerRows.reduce(
      (acc: number, row: regionPlayerTokenResult) =>
        acc + row.total_base_pp_after_cap,
      0,
    );
    const count_sum = playerRows.reduce(
      (acc: number, row: regionPlayerTokenResult) => acc + Number(row.count),
      0,
    );

    // === Final output ===
    playerSummaries.push({
      player,
      total_harvest_pp: harvest_sum,
      total_base_pp_after_cap: base_sum,
      count: count_sum,
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

  const data = playerSummaries.map((summary) => ({
    player: summary.player,
    total_harvest_pp: summary.total_harvest_pp,
    total_base_pp_after_cap: summary.total_base_pp_after_cap,
    count: summary.count,
    total_dec: summary.total_dec,
    dec_grain: summary.dec_grain || 0,
    dec_wood: summary.dec_wood || 0,
    dec_stone: summary.dec_stone || 0,
    dec_iron: summary.dec_iron || 0,
    dec_research: summary.dec_research || 0,
    dec_aura: summary.dec_aura || 0,
    dec_sps: summary.dec_sps || 0,
  }));
  logger.info(`📦 Inserting ${data.length} playerSummaries...`);
  await prisma.playerProductionSummary.createMany({
    data: data,
  });

  logger.info(
    `✅ Stored player production for ${today.toISOString().split("T")[0]}`,
  );
}
