import { Resource } from "@/constants/resource/resource";
import {
  calcConsumeCosts,
  calcDECPrice,
  calcProduction,
  determineRecipe,
} from "@/lib/shared/costCalc";
import { TAX_RATE } from "@/lib/shared/statics";
import { determineCardMaxBCX } from "@/lib/utils/cardUtil";
import {
  basePPMax,
  CardBloodline,
  CardElement,
  cardFoilModifiers,
  cardSetModifiers,
  deedResourceBoostRules,
  DeedType,
  PlotPlannerData,
  plotRarityModifiers,
  PlotStatus,
  resourceWorksiteMap,
  RUNI_FLAT_ADD,
  runiModifiers,
  SlotComputedPP,
  SlotInput,
  TERRAIN_BONUS,
  titleModifiers,
  totemModifiers,
  WorksiteType,
} from "@/types/planner";
import { Prices } from "@/types/price";
import { ProductionInfo, ResourceWithDEC } from "@/types/productionInfo";
import { RegionTax } from "@/types/regionTax";

export function terrainBonusPct(
  terrain: DeedType,
  element: CardElement,
): number {
  if (!terrain) return 0;
  return TERRAIN_BONUS[terrain]?.[element] ?? 0;
}

export function determineDeedResourceBoost(
  plotStatus: PlotStatus,
  worksiteType: WorksiteType,
): number {
  return deedResourceBoostRules[plotStatus]?.includes(worksiteType) ? 1 : 0;
}

export function calcBoostedPP(
  basePP: number,
  plot: PlotPlannerData,
  terrainModifier: number,
) {
  const rarityPct = plotRarityModifiers[plot.plotRarity];
  const titlePct = titleModifiers[plot.title];
  const totemPct = totemModifiers[plot.totem];
  const runiPct = runiModifiers[plot.runi];
  const { totalBloodlineBoost } = determineBloodlineBoost(plot.cardInput);

  const terrainBoostedPP = basePP * (1 + terrainModifier);

  const deedResourceBoost = determineDeedResourceBoost(
    plot.plotStatus,
    plot.worksiteType,
  );

  const totalBoostedMultiplier =
    1 +
    totemPct +
    titlePct +
    runiPct +
    rarityPct +
    deedResourceBoost +
    totalBloodlineBoost;
  return terrainBoostedPP * totalBoostedMultiplier;
}

export function computeSlot(
  slot: SlotInput,
  plot: PlotPlannerData,
): SlotComputedPP {
  const basePP = calcBasePP(slot);

  const terrainBoost = terrainBonusPct(plot.deedType, slot.element);
  const boostedPP = calcBoostedPP(basePP, plot, terrainBoost);

  return {
    basePP,
    boostedPP,
  };
}

function calcBasePP(slot: SlotInput) {
  const foilId = slot.foil === "regular" ? 0 : 1; // for other variant use gold foil
  const maxBasePP =
    basePPMax[slot.rarity][slot.foil === "regular" ? "regular" : "gold"];
  const maxBCX = determineCardMaxBCX(slot.set, slot.rarity, foilId);

  const ppPerBcx = maxBasePP / maxBCX;
  return (
    ppPerBcx *
    slot.bcx *
    (cardSetModifiers[slot.set] ?? 0) *
    (cardFoilModifiers[slot.foil] ?? 1)
  );
}

export function calcTotalPP(plotPlannerData: PlotPlannerData) {
  const { sumBasePP, sumBoostedPP } = plotPlannerData.cardInput.reduce(
    (acc, slot) => {
      const { basePP, boostedPP } = computeSlot(slot, plotPlannerData);
      acc.sumBasePP += basePP;
      acc.sumBoostedPP += boostedPP;
      return acc;
    },
    { sumBasePP: 0, sumBoostedPP: 0 },
  );

  const runiBasePP = RUNI_FLAT_ADD[plotPlannerData.runi];
  const runiBoostedPP = calcBoostedPP(runiBasePP, plotPlannerData, 0);
  const totalBasePP = sumBasePP + runiBasePP;
  const totalBoostedPP = sumBoostedPP + runiBoostedPP;

  return { totalBasePP, totalBoostedPP };
}

export function calcProductionInfo(
  totalBasePP: number,
  totalBoostedPP: number,
  plotPlannerData: PlotPlannerData,
  prices: Prices,
  spsRatio: number,
  regionTax: RegionTax[] | null,
  captureRate: number | null,
): ProductionInfo {
  const worksiteType = plotPlannerData.worksiteType;

  const resource = resourceWorksiteMap[worksiteType ?? "GRAIN"];

  if (resource === "TAX" && captureRate && regionTax) {
    const regionNumber = plotPlannerData.regionNumber;
    const tractNumber = plotPlannerData.tractNumber;

    const consume = worksiteType === "KEEP" ? 1000 : 10_000;

    const region = regionTax?.find(
      (r) => r.castleOwner?.regionNumber === regionNumber,
    );

    const rewardsPerHour =
      worksiteType === "KEEP"
        ? region?.perTract?.[String(tractNumber ?? "")]?.resourceRewardsPerHour
        : region?.resourceRewardsPerHour;

    const capturedTaxInResource: Record<string, number> = {};
    for (const resource of Object.keys(rewardsPerHour ?? [])) {
      if (rewardsPerHour) {
        capturedTaxInResource[resource] =
          rewardsPerHour[resource] * TAX_RATE * captureRate;
      }
    }

    const produces: ResourceWithDEC[] = Object.entries(
      capturedTaxInResource,
    ).map(([resource, amount]) => ({
      resource: resource as Resource,
      amount,
      sellPriceDEC: calcDECPrice(
        "sell",
        resource as ResourceWithDEC["resource"],
        amount,
        prices,
      ),
      buyPriceDEC: calcDECPrice(
        "buy",
        resource as ResourceWithDEC["resource"],
        amount,
        prices,
      ),
    }));

    const produceDEC = produces.reduce((acc, row) => acc + row.sellPriceDEC, 0);

    return {
      resource,
      consume: [
        {
          resource: "GRAIN",
          amount: consume,
          sellPriceDEC: 0, // because of the flat fee remove cost of grain
          buyPriceDEC: 0,
        },
      ],
      produce: produces,
      netDEC: produceDEC,
    };
  }

  const consumeGrainDiscount = determineGrainConsumeReduction(
    plotPlannerData.cardInput,
  );
  const consume = calcConsumeCosts(
    totalBasePP,
    prices,
    1,
    determineRecipe(resource),
    consumeGrainDiscount,
  );

  const productionBoosts = determineProductionBoost(
    resource,
    plotPlannerData.cardInput,
  );

  const produce = calcProduction(
    resource,
    totalBoostedPP,
    productionBoosts,
    prices,
    1,
    spsRatio,
  );

  const totalDECConsume = consume.reduce(
    (sum, row) => sum + Number(row.sellPriceDEC || 0),
    0,
  );
  const netDEC = produce.sellPriceDEC - totalDECConsume;

  return {
    resource,
    consume,
    produce: [produce],
    netDEC,
  };
}

export function calcTotemChancePerHour(
  worksiteType: WorksiteType,
  basePP: number,
): number | undefined {
  if (
    worksiteType === "KEEP" ||
    worksiteType === "CASTLE" ||
    worksiteType === "Research Hut"
  ) {
    let multiplier = 1;
    switch (worksiteType) {
      case "KEEP":
        multiplier = 3;
        break;
      case "CASTLE":
        multiplier = 10;
        break;
    }
    return (basePP / 1000) * 0.0007 * multiplier;
  }
  return undefined;
}

/**
 * Determines the total production boost (%) for a specific resource.
 * @param resource The resource to check for boosts.
 * @param cardInput The list of cards to evaluate.
 * @returns The total production boost for the specified resource. 0.1 means 10% boost.
 */
export function determineProductionBoost(
  resource: Resource,
  cardInput: SlotInput[],
): number {
  let totalBoost = 0;

  if (resource) {
    cardInput.forEach((card) => {
      if (card.landBoosts?.produceBoost) {
        Object.entries(card.landBoosts.produceBoost).forEach(
          ([produceBoostResource, boost]) => {
            if (resource === produceBoostResource && boost > 0) {
              totalBoost += boost;
            }
          },
        );
      }
    });
  }
  return totalBoost;
}

/**
 * Determines the total consume discount (%) for a specific resource.
 * @param cardInput The list of cards to evaluate.
 * @returns The total consume discount for grain resource. 0.1 means 10% discount.
 */
export function determineGrainConsumeReduction(cardInput: SlotInput[]): number {
  return cardInput.reduce((sum, card) => {
    return sum + (card.landBoosts?.consumeGrainDiscount || 0);
  }, 0);
}

/**
 * Determines the total bloodline boost (%) from all cards with Toil and Kin abilities.
 * Rules:
 * - If bloodlineBoost (number) applies it applies to all cards
 * - The boost only applies if there's at least one OTHER card with the same bloodline on the plot
 * - Multiple cards with boosts for the same bloodline don't stack (max value is used)
 *
 * @param cardInput The list of cards on the plot
 * @returns The total bloodline boost multiplier. 0.10 means 10% boost.
 *
 * @example
 * // Card A (Elf) with bloodlineBoost +10% + Card B (Elf) = +10%
 * // Card A (Elf) with bloodlineBoost +10% + Card B (Undead) = 0%
 * // Card A (Elf) with bloodlineBoost +10% + Card B (Elf) with bloodlineBoost +20% + Card C (Elf) = +20% (uses max)
 */
export function determineBloodlineBoost(cardInput: SlotInput[]): {
  totalBloodlineBoost: number;
  bloodlineBoostDetails: Array<{
    bloodline: CardBloodline;
    boost: number;
  }>;
} {
  const maxBloodlineBoosts: Record<CardBloodline, number> =
    getMaxBloodlineBoosts(cardInput);

  // Then, determine which bloodlines are actually present with other cards
  let totalBloodlineBoost = 0;
  const bloodlineBoostDetails: Array<{
    bloodline: CardBloodline;
    boost: number;
  }> = [];

  Object.entries(maxBloodlineBoosts).forEach(([bloodline, boost]) => {
    const bloodlineType = bloodline as CardBloodline;

    // Count how many cards have this bloodline (with bcx > 0)
    const cardsWithBloodline = cardInput.filter(
      (card) => card.bloodline === bloodlineType && card.bcx > 0,
    );

    // Apply boost only if there are at least 2 cards with this bloodline
    if (cardsWithBloodline.length >= 2) {
      totalBloodlineBoost += boost;
      bloodlineBoostDetails.push({ bloodline: bloodlineType, boost });
    }
  });

  return { totalBloodlineBoost, bloodlineBoostDetails };
}

/**
 * Gets the maximum bloodline boost for each bloodline from the card slots
 * @param cardInput The list of cards on the plot
 * @returns A record mapping each bloodline to its maximum boost value
 */
export function getMaxBloodlineBoosts(cardInput: SlotInput[]) {
  const maxBloodlineBoosts: Record<CardBloodline, number> = {} as Record<
    CardBloodline,
    number
  >;

  cardInput.forEach((card) => {
    const boost = card.landBoosts?.bloodlineBoost;
    if (!boost || boost <= 0) return;

    const cardBloodline = card.bloodline;
    const currentMax = maxBloodlineBoosts[cardBloodline] || 0;
    maxBloodlineBoosts[cardBloodline] = Math.max(currentMax, boost);
  });

  return maxBloodlineBoosts;
}
