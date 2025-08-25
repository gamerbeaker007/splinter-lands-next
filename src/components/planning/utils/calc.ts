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
import { Rarity } from "@/types/rarity";
import { capitalize } from "@mui/material";

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
  const boostedPP = terrainBoostedPP * totalBoostedMultiplier;
  return boostedPP;
}

export function computeSlot(
  slot: SlotInput,
  plot: PlotModifiers,
): SlotComputedPP {
  const foilId = slot.foil === "regular" ? 0 : 1; // for other variant use gold foil
  const maxBasePP =
    basePPMax[slot.rarity][slot.foil === "regular" ? "regular" : "gold"];
  // TODO look into converio to rarity with lower cases!
  const maxBCX = determineCardMaxBCX(
    slot.set,
    capitalize(slot.rarity) as Rarity,
    foilId,
  );

  const ppPerBcx = maxBasePP / maxBCX;
  const basePP =
    ppPerBcx *
    slot.bcx *
    (cardSetModifiers[slot.set] ?? 0) *
    (cardFoilModifiers[slot.foil] ?? 1);
  const tPct = terrainBonusPct(plot.deedType, slot.element);

  const boostedPP = calcBoostedPP(basePP, plot, tPct);

  return {
    basePP,
    boostedPP,
  };
}

export function calcTotalPP(slots: SlotInput[], plot: PlotModifiers) {
  const { sumBasePP, sumBoostedPP } = slots.reduce(
    (acc, slot) => {
      const { basePP, boostedPP } = computeSlot(slot, plot);
      acc.sumBasePP += basePP;
      acc.sumBoostedPP += boostedPP;
      return acc;
    },
    { sumBasePP: 0, sumBoostedPP: 0 },
  );

  const basePP = RUNI_FLAT_ADD[plot.runi];
  const boostedPP = calcBoostedPP(basePP, plot, 0);
  const totalBasePP = sumBasePP + basePP;
  const totalBoostedPP = sumBoostedPP + boostedPP;
  return { totalBasePP, totalBoostedPP };
}

export function calcProductionInfo(
  totalBasePP: number,
  totalBoostedPP: number,
  plotModifiers: PlotModifiers,
  prices: Prices,
  spsRatio: number,
): ProductionInfo {
  const resource = resourceWorksiteMap[plotModifiers.worksiteType];
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
