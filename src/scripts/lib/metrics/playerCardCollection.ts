import {
  fetchCardDetails,
  fetchPlayerCardCollection,
} from "@/lib/backend/api/spl/spl-base-api";
import logger from "@/lib/backend/log/logger.server";
import { prisma } from "@/lib/prisma";
import { RarityLevelCounts } from "@/types/LandcardCollection";
import { cardFoilOptions, cardRarityOptions } from "@/types/planner";
import { SplCardDetails } from "@/types/splCardDetails";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import pLimit from "p-limit";

const limit = pLimit(3);
const MIN_INTERVAL_MS = 500;
let nextAvailableTime = Date.now();

async function throttleRate(minIntervalMs: number) {
  const now = Date.now();
  const waitTime = Math.max(0, nextAvailableTime - now);
  nextAvailableTime = Math.max(now, nextAvailableTime) + minIntervalMs;
  if (waitTime > 0) {
    await new Promise((res) => setTimeout(res, waitTime));
  }
}

/**
 * A card is considered "on land" when it is actively staked on a plot
 * (stake_plot is set and stake_end_date is null = not in cooldown).
 */
function isCardOnLand(card: SplPlayerCardCollection): boolean {
  return card.stake_plot != null && card.stake_end_date == null;
}

function getCardRarity(
  cardDetailId: number,
  cardDetails: SplCardDetails[]
): number {
  const card = cardDetails.find((cd) => cd.id === cardDetailId);
  return card?.rarity ?? 1;
}

/**
 * A card is currently rented when rental_days and rental_date are set
 * and the rental period has not yet expired.
 */
function isActiveRental(card: SplPlayerCardCollection): boolean {
  if (!card.rental_days || !card.rental_date) return false;
  const days = Number.parseInt(card.rental_days, 10);
  if (Number.isNaN(days)) return false;
  const end = new Date(card.rental_date).getTime() + days * 24 * 60 * 60 * 1000;
  return Date.now() < end;
}

// foil index (card.foil 0-4) → DB column name in CardSetStats
const FOIL_COLS = [
  "foil_regular",
  "foil_gold",
  "foil_gold_arcane",
  "foil_black",
  "foil_black_arcane",
] as const;
type FoilCol = (typeof FOIL_COLS)[number];

type CardSetStats = {
  total_cards: number;
  foil_regular: number;
  foil_gold: number;
  foil_gold_arcane: number;
  foil_black: number;
  foil_black_arcane: number;
  owned: number;
  rented: number;
  delegated: number;
  rarity_level_counts: RarityLevelCounts;
};

export async function computeAndStorePlayerCardCollections(today: Date) {
  logger.info("📋 playerCardCollections - Fetching unique players...");

  // Only players who have at least one deed with active cards on land (total_base_pp_after_cap > 0)
  const activePlayers = await prisma.deed.findMany({
    distinct: ["player"],
    select: { player: true },
    where: {
      player: { not: null },
      stakingDetail: { total_base_pp_after_cap: { gt: 0 } },
    },
  });
  logger.info(
    `📋 playerCardCollections - Players with cards on land: ${activePlayers.length}`
  );

  const playerNames = activePlayers
    .filter((p) => p.player !== null)
    .map((p) => p.player as string);

  const cardDetails = await fetchCardDetails();
  logger.info(
    `📋 playerCardCollections - Fetched ${cardDetails.length} card details`
  );

  const editionSummaryRows: ({
    date: Date;
    player: string;
    card_set: string;
  } & CardSetStats)[] = [];

  let current = 0;

  const tasks = playerNames.map((player) =>
    limit(async () => {
      await throttleRate(MIN_INTERVAL_MS);

      try {
        const collection = await fetchPlayerCardCollection(player, true);
        const landCards = collection.filter(isCardOnLand);

        const cardSetMap = new Map<string, CardSetStats>();

        for (const card of landCards) {
          const cardSet = card.card_set;
          const rarity = getCardRarity(card.card_detail_id, cardDetails);
          const level = card.level;
          const foil = card.foil;

          // --- Per-player card_set summary ---
          if (!cardSetMap.has(cardSet)) {
            cardSetMap.set(cardSet, {
              total_cards: 0,
              foil_regular: 0,
              foil_gold: 0,
              foil_gold_arcane: 0,
              foil_black: 0,
              foil_black_arcane: 0,
              owned: 0,
              rented: 0,
              delegated: 0,
              rarity_level_counts: {} as RarityLevelCounts,
            });
          }

          const stats = cardSetMap.get(cardSet)!;
          stats.total_cards++;

          const foilCol: FoilCol = FOIL_COLS[foil] ?? "foil_regular";
          stats[foilCol]++;

          // Ownership: delegated_to being set means card is delegated out to someone
          if (card.delegated_to != null) {
            if (isActiveRental(card)) {
              stats.rented++;
            } else {
              stats.delegated++;
            }
          } else {
            stats.owned++;
          }

          // --- Per-player rarity/level/foil counts (stored in the row JSON) ---
          // Keys: rarity name ("common","rare","epic","legendary"), level string, foil name ("regular","gold arcane", etc.)
          const rlc = stats.rarity_level_counts;
          const rarityName = cardRarityOptions[rarity - 1] ?? "common";
          const levelKey = String(level);
          const foilName = cardFoilOptions[foil] ?? "regular";
          if (!rlc[rarityName]) rlc[rarityName] = {};
          if (!rlc[rarityName][levelKey]) rlc[rarityName][levelKey] = {};
          rlc[rarityName][levelKey][foilName] =
            (rlc[rarityName][levelKey][foilName] ?? 0) + 1;
        }

        for (const [card_set, stats] of cardSetMap) {
          editionSummaryRows.push({ date: today, player, card_set, ...stats });
        }

        ++current;
        if (current % 10 === 0 || current === playerNames.length) {
          logger.info(
            `playerCardCollections - Processing player ${current} / ${playerNames.length}`
          );
        }
      } catch (err) {
        console.error(`Failed to fetch card collection for ${player}:`, err);
      }
    })
  );

  await Promise.all(tasks);

  logger.info(`🧹 playerCardCollections - Clearing existing data...`);
  await prisma.playerCardEditionSummary.deleteMany();

  const BATCH_SIZE = 1000;

  logger.info(
    `📦 Injecting ${editionSummaryRows.length} edition summary rows...`
  );
  for (let i = 0; i < editionSummaryRows.length; i += BATCH_SIZE) {
    await prisma.playerCardEditionSummary.createMany({
      data: editionSummaryRows.slice(i, i + BATCH_SIZE),
    });
  }

  logger.info("✅ playerCardCollections - Done!");
}
