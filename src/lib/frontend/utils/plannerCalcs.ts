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
  const bloodlinePct = determineBloodlineBoost(plot.cardInput);

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
    bloodlinePct;
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
 * - Each card can have bloodlineBoost which is a Record<CardBloodline, number>
 * - For each bloodline boost, check if there's at least one card with that bloodline on the plot
 * - If yes, apply the boost. Multiple cards with same bloodline boost don't stack (max once per bloodline type)
 * - Different bloodline boosts (e.g., Elf +10% and Mundane Beast +5%) stack additively
 *
 * @param cardInput The list of cards on the plot
 * @returns The total bloodline boost multiplier. 0.15 means 15% boost.
 *
 * @example
 * // Example 3: Card with Elf +10% working with 2 other elfs = +10% (not +20%)
 * // Example 5: Card with Elf +10% and Mundane Beast +5%, plus one elf and one mundane beast = +15%
 */
export function determineBloodlineBoost(cardInput: SlotInput[]): number {
  // Collect all unique bloodline boosts from all cards
  const bloodlineBoosts: Record<CardBloodline, number> = {} as Record<
    CardBloodline,
    number
  >;

  cardInput.forEach((card) => {
    const boosts = card.landBoosts?.bloodlineBoost;
    if (!boosts) return;

    Object.entries(boosts).forEach(([bloodline, value]) => {
      if (value > 0) {
        // Store the maximum boost value for each bloodline (in case multiple cards have different values)
        const currentValue = bloodlineBoosts[bloodline as CardBloodline] || 0;
        bloodlineBoosts[bloodline as CardBloodline] = Math.max(
          currentValue,
          value,
        );
      }
    });
  });

  // Check which bloodlines are present on the plot
  const bloodlinesOnPlot = new Set<CardBloodline>(
    cardInput.filter((card) => card.bcx > 0).map((card) => card.bloodline),
  );

  // Sum boosts for bloodlines that are present on the plot
  let totalBoost = 0;
  Object.entries(bloodlineBoosts).forEach(([bloodline, boost]) => {
    if (bloodlinesOnPlot.has(bloodline as CardBloodline)) {
      totalBoost += boost;
    }
  });

  return totalBoost;
}
