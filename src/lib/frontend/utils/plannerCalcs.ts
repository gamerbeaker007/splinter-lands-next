import { calcConsumeCosts, calcProduction } from "@/lib/shared/costCalc";
import { determineCardMaxBCX } from "@/lib/utils/cardUtil";
import {
  basePPMax,
  CardElement,
  cardFoilModifiers,
  cardSetModifiers,
  deedResourceBoostRules,
  DeedType,
  PlotModifiers,
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
import { ProductionInfo } from "@/types/productionInfo";

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
  plot: PlotModifiers,
  terrainModifier?: number,
) {
  const rarityPct = plotRarityModifiers[plot.plotRarity];
  const titlePct = titleModifiers[plot.title];
  const totemPct = totemModifiers[plot.totem];
  const runiPct = runiModifiers[plot.runi];

  const terrainBoostedPP = basePP * (1 + (terrainModifier ?? 0));

  const totalBoostedMultiplier =
    1 + totemPct + titlePct + runiPct + rarityPct + plot.deedResourceBoost;
  return terrainBoostedPP * totalBoostedMultiplier;
}

export function computeSlot(
  slot: SlotInput,
  plot: PlotModifiers,
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

export function calcTotalPP(slots: SlotInput[], plotModifiers: PlotModifiers) {
  const { sumBasePP, sumBoostedPP } = slots.reduce(
    (acc, slot) => {
      const { basePP, boostedPP } = computeSlot(slot, plotModifiers);
      acc.sumBasePP += basePP;
      acc.sumBoostedPP += boostedPP;
      return acc;
    },
    { sumBasePP: 0, sumBoostedPP: 0 },
  );

  const runiBasePP = RUNI_FLAT_ADD[plotModifiers.runi];
  const runiBoostedPP = calcBoostedPP(runiBasePP, plotModifiers, 0);
  const totalBasePP = sumBasePP + runiBasePP;
  const totalBoostedPP = sumBoostedPP + runiBoostedPP;

  return { totalBasePP, totalBoostedPP };
}

export function calcProductionInfo(
  totalBasePP: number,
  totalBoostedPP: number,
  plotModifiers: PlotModifiers,
  prices: Prices,
  spsRatio: number,
): ProductionInfo {
  const resource = resourceWorksiteMap[plotModifiers.worksiteType ?? "GRAIN"];
  const consume = calcConsumeCosts(resource, totalBasePP, prices, 1);
  const produce = calcProduction(resource, totalBoostedPP, prices, 1, spsRatio);

  const totalDECConsume = consume.reduce(
    (sum, row) => sum + Number(row.sellPriceDEC || 0),
    0,
  );
  const netDEC = produce.sellPriceDEC - totalDECConsume;

  return {
    consume,
    produce,
    netDEC,
  };
}
