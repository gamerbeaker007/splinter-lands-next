import { fetchResourceSupply } from "@/lib/backend/api/spl/spl-land-api";
import logger from "@/lib/backend/log/logger.server";
import { prisma } from "@/lib/prisma";

const LEADERBOARD_RESOURCES = [
  "GRAIN",
  "WOOD",
  "STONE",
  "IRON",
  "RESEARCH",
  "AURA",
];

export async function computeAndStoreTotalSupply(today: Date) {
  logger.info(`⌛ --- Start computeAndStoreTotalSupply...`);

  const results = await Promise.all(
    LEADERBOARD_RESOURCES.map(async (resource) => {
      const rows = await fetchResourceSupply(resource);
      const totalSupply = rows.reduce(
        (acc, row) => acc + Number(row.amount || 0),
        0,
      );

      return {
        date: today,
        resource,
        total_supply: BigInt(Math.round(totalSupply)),
      };
    }),
  );

  for (const { date, resource, total_supply } of results) {
    await prisma.resourceSupply.upsert({
      where: {
        date_resource: {
          date,
          resource,
        },
      },
      update: {
        total_supply,
      },
      create: {
        date,
        resource,
        total_supply,
      },
    });
  }

  logger.info(
    `✅ Stored resource supply for ${today.toISOString().split("T")[0]}`,
  );
}
