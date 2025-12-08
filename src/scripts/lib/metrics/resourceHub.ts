import { Prisma } from "@/generated/prisma/client";
import { fetchLandResourcesPools } from "@/lib/backend/api/spl/spl-land-api";
import { getPrices } from "@/lib/backend/api/spl/spl-prices-api";
import logger from "@/lib/backend/log/logger.server";
import { prisma } from "@/lib/prisma";
import { SplLandPool } from "@/types/spl/landPools";
import { GRAIN_CONVERSION_RATIOS } from "../../../lib/shared/statics";

export async function computeAndStoreResourceHubMetrics(today: Date) {
  logger.info(`⌛ --- Start computeAndStoreResourceHubMetrics...`);

  const resources = await fetchLandResourcesPools();
  if (!resources || resources.length === 0) {
    logger.warn("⚠️ No land resource pool data available.");
    return;
  }

  const prices = await getPrices();
  const decUSDPrice = prices?.dec ?? 0;

  const grainResource = resources.find(
    (r: { token_symbol: string }) => r.token_symbol === "GRAIN"
  );
  const grainPrice = grainResource?.resource_price || 0;

  const dataToInsert = resources.map((row: SplLandPool) => {
    const resourcePrice = row.resource_price;
    const resource = row.token_symbol;
    const { grainEquivalent, factor } = calculateGrainEquivalentAndFactor(
      resource,
      resourcePrice,
      grainPrice
    );
    return {
      date: today,
      id: row.id,
      token_symbol: row.token_symbol,
      resource_quantity: row.resource_quantity,
      resource_volume: row.resource_volume,
      resource_volume_1: row.resource_volume_1,
      resource_volume_30: row.resource_volume_30,
      resource_price: row.resource_price,
      dec_quantity: row.dec_quantity,
      dec_volume: row.dec_volume,
      dec_volume_1: row.dec_volume_1,
      dec_volume_30: row.dec_volume_30,
      dec_price: row.dec_price,
      total_shares: row.total_shares,
      created_date: row.created_date,
      last_updated_date: row.last_updated_date,
      dec_usd_value: decUSDPrice,
      grain_equivalent: grainEquivalent,
      factor: factor,
    };
  });

  // Optional: delete today's existing entries to avoid duplicates
  await prisma.resourceHubMetrics.deleteMany({ where: { date: today } });

  await prisma.resourceHubMetrics.createMany({
    data: dataToInsert as Prisma.ResourceHubMetricsCreateManyInput[],
    skipDuplicates: true,
  });

  logger.info(
    `✅ Stored resource hub metrics for ${dataToInsert.length} tokens on ${today.toISOString().split("T")[0]}`
  );
}

function calculateGrainEquivalentAndFactor(
  tokenSymbol: string,
  resourcePrice: number,
  grainPrice: number
): { grainEquivalent: number | null; factor: number | null } {
  if (tokenSymbol === "GRAIN") {
    return { grainEquivalent: 1, factor: 1 };
  }

  if (!grainPrice || grainPrice <= 0) {
    logger.warn("⚠️ Grain price is zero or invalid.");
    return { grainEquivalent: null, factor: null };
  }

  const conversionRatio = GRAIN_CONVERSION_RATIOS[tokenSymbol];
  if (!conversionRatio) {
    logger.warn(`⚠️ Unknown token symbol: ${tokenSymbol}`);
    return { grainEquivalent: null, factor: null };
  }

  const grainEquivalent = resourcePrice / grainPrice;
  const factor = grainEquivalent / conversionRatio;

  return { grainEquivalent, factor };
}
