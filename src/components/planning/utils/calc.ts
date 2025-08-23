import { determineCardMaxBCX } from "@/lib/utils/cardUtil";
import {
  basePPMax,
  CardElement,
  cardSetModifiers,
  DeedType,
  PlotModifiers,
  plotRarityModifiers,
  runiModifiers,
  SlotComputedPP,
  SlotInput,
  TERRAIN_BONUS,
  titleModifiers,
  totemModifiers,
} from "@/types/planner";
import { Rarity } from "@/types/rarity";
import { capitalize } from "@mui/material";

export function terrainBonusPct(
  terrain: DeedType,
  element: CardElement,
): number {
  if (!terrain) return 0;
  return TERRAIN_BONUS[terrain]?.[element] ?? 0;
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

  // TODO 100% bonus on AURA and RESOURCE when magical
  // TODO 100% bonus on SPS when occupied

  const totalBoostedMultiplier = 1 + totemPct + titlePct + runiPct + rarityPct;
  const boostedPP = terrainBoostedPP * totalBoostedMultiplier;
  return boostedPP;
}

export function computeSlot(
  slot: SlotInput,
  plot: PlotModifiers,
): SlotComputedPP {
  const maxBasePP = basePPMax[slot.rarity][slot.foil];
  const foilId = slot.foil === "regular" ? 0 : 1;

  // TODO look into converio to rarity with lower cases!
  const maxBCX = determineCardMaxBCX(
    slot.set,
    capitalize(slot.rarity) as Rarity,
    foilId,
  );

  const ppPerBcx = maxBasePP / maxBCX;
  const basePP = ppPerBcx * slot.bcx * (cardSetModifiers[slot.set] ?? 0);

  const tPct = terrainBonusPct(plot.deedType, slot.element);

  const boostedPP = calcBoostedPP(basePP, plot, tPct);

  return {
    basePP,
    boostedPP,
  };
}

// export function sumTotals(slots: SlotComputed[]) {
//   return slots.reduce(
//     (acc, s) => {
//       acc.totalBasePP += s.basePP;
//       acc.totalBoostedPP += s.boostedPP;
//       return acc;
//     },
//     { totalBasePP: 0, totalBoostedPP: 0 },
//   );
// }
