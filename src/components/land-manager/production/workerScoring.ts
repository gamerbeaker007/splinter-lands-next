import {
  deedToPlotPlannerData,
  PlotBoostOverrides,
} from "@/lib/frontend/utils/deedToPlotPlanner";
import {
  calcProductionInfo,
  calcTotalPP,
  computeSlot,
} from "@/lib/frontend/utils/plannerCalcs";
import { determineCardMaxBCX } from "@/lib/utils/cardUtil";
import { DeedComplete } from "@/types/deed";
import { CardSetNameLandValid } from "@/types/editions";
import {
  bestTerrainBonusPct,
  CardBloodline,
  cardFoilOptions,
  SlotInput,
} from "@/types/planner";
import { PlaygroundCard } from "@/types/playground";
import { Prices } from "@/types/price";
import { SpotCardVM } from "./productionConfigTypes";

/** Numeric foil id for a card's foil string (0 = regular). */
function foilId(card: PlaygroundCard): number {
  const idx = cardFoilOptions.indexOf(card.foil);
  return idx < 0 ? 0 : idx;
}

/** Build a planner SlotInput from a player's card for boosted-PP scoring. */
export function playgroundCardToSlotInput(card: PlaygroundCard): SlotInput {
  return {
    id: 0,
    set: card.set as CardSetNameLandValid,
    rarity: card.rarity,
    bcx: card.bcx,
    foil: card.foil,
    element: card.element,
    secondaryElement: card.subElement,
    bloodline: "Unknown" as CardBloodline,
    landBoosts: card.landBoost ?? undefined,
  };
}

/**
 * Score a card on a specific plot: full plot-boosted PP (terrain + biome +
 * plot multipliers) via the planner calc, normalized into a SpotCardVM ready
 * to display in a CardTile and stage as a worker.
 */
export function scorePlaygroundCard(
  card: PlaygroundCard,
  deed: DeedComplete
): SpotCardVM {
  const slot = playgroundCardToSlotInput(card);
  const plot = deedToPlotPlannerData(deed, [slot]);
  const { basePP, boostedPP } = computeSlot(slot, plot);
  const fid = foilId(card);
  return {
    uid: card.uid,
    name: card.name,
    rarity: card.rarity,
    set: card.set,
    element: card.element,
    secondaryElement: card.subElement,
    edition: card.edition,
    foil: fid,
    bcx: card.bcx,
    maxBcx: determineCardMaxBCX(card.set, card.rarity, fid),
    basePP,
    boostedPP,
    terrainBoost: bestTerrainBonusPct(
      plot.deedType,
      card.element,
      card.subElement
    ),
    fromChain: false,
    onWagon: card.onWagon,
    inSet: card.inSet,
  };
}

/** Minimal card shape needed to build a planner SlotInput. */
type SlotCardLike = Pick<
  SpotCardVM,
  "set" | "rarity" | "bcx" | "foil" | "element" | "secondaryElement"
>;

function spotCardToSlotInput(card: SlotCardLike, id: number): SlotInput {
  return {
    id,
    set: card.set as CardSetNameLandValid,
    rarity: card.rarity,
    bcx: card.bcx,
    foil: cardFoilOptions[card.foil] ?? "regular",
    element: card.element,
    secondaryElement: card.secondaryElement,
    bloodline: "Unknown" as CardBloodline,
  };
}

/** A produced/consumed resource amount per hour. */
export interface ResourceAmount {
  resource: string;
  amount: number;
}

/** A plot's projected production for a given set of worker cards. */
export interface PlotProjection {
  basePP: number;
  boostedPP: number;
  /** Produced resource(s) per hour (amount in resource units, e.g. GRAIN). */
  produce: ResourceAmount[];
  /** Consumed resource(s) per hour (amount in resource units, e.g. GRAIN/IRON). */
  consume: ResourceAmount[];
  netDEC: number;
}

/**
 * Project a plot's production for the given worker cards using the planner's
 * own calc (so current vs staged are computed on the same scale). Pass
 * `overrides` to reflect a staged (not-yet-saved) title/totem/runi.
 */
export function projectPlot(
  deed: DeedComplete,
  workers: SlotCardLike[],
  prices: Prices,
  overrides?: PlotBoostOverrides
): PlotProjection {
  const slots = workers.map((w, i) => spotCardToSlotInput(w, i + 1));
  const plot = deedToPlotPlannerData(deed, slots, overrides);
  const { totalBasePP, totalBoostedPP } = calcTotalPP(plot);
  const info = calcProductionInfo(
    totalBasePP,
    totalBoostedPP,
    plot,
    prices,
    0,
    null,
    null
  );
  return {
    basePP: totalBasePP,
    boostedPP: totalBoostedPP,
    produce: info.produce.map((p) => ({
      resource: p.resource,
      amount: p.amount,
    })),
    consume: info.consume.map((c) => ({
      resource: c.resource,
      amount: c.amount,
    })),
    netDEC: info.netDEC,
  };
}
