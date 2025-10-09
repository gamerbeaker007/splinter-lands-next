import { Resource } from "@/constants/resource/resource";
import {
  calcConsumeCosts,
  calcDECPrice,
  calcProduction,
} from "@/lib/shared/costCalc";
import { TAX_RATE } from "@/lib/shared/statics";
import { determineCardMaxBCX } from "@/lib/utils/cardUtil";
import {
  basePPMax,
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
  terrainModifier?: number,
) {
  const rarityPct = plotRarityModifiers[plot.plotRarity];
  const titlePct = titleModifiers[plot.title];
  const totemPct = totemModifiers[plot.totem];
  const runiPct = runiModifiers[plot.runi];

  const terrainBoostedPP = basePP * (1 + (terrainModifier ?? 0));

  const deedResourceBoost = determineDeedResourceBoost(
    plot.plotStatus,
    plot.worksiteType,
  );

  const totalBoostedMultiplier =
    1 + totemPct + titlePct + runiPct + rarityPct + deedResourceBoost;
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

  const consume = calcConsumeCosts(resource, totalBasePP, prices, 1);
  const produce = calcProduction(resource, totalBoostedPP, prices, 1, spsRatio);
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
