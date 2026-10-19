import {
  deedToPlotPlannerData,
  PlotBoostOverrides,
} from "@/lib/frontend/utils/deedToPlotPlanner";
import { isCooldownActive } from "@/lib/frontend/utils/landCardFilters";
import {
  calcCaptureRate,
  calcProductionInfo,
  calcTotalPP,
  computeSlot,
} from "@/lib/frontend/utils/plannerCalcs";
import { WorkerPlanPick, WorkerPlanPlotCard } from "@/types/landManager";
import { determineCardMaxBCX } from "@/lib/utils/cardUtil";
import { DeedComplete } from "@/types/deed";
import { CardSetNameLandValid } from "@/types/editions";
import {
  bestTerrainBonusPct,
  CardBloodline,
  cardFoilOptions,
  SlotInput,
} from "@/types/planner";
import { PlayerLandCard } from "@/types/playerLandCard";
import { Prices } from "@/types/price";
import { RegionTax } from "@/types/regionTax";
import { SpotCardVM } from "../productionConfigTypes";

/** Numeric foil id for a card's foil string (0 = regular). */
function foilId(card: PlayerLandCard): number {
  const idx = cardFoilOptions.indexOf(card.foil);
  return idx < 0 ? 0 : idx;
}

/** Build a planner SlotInput from a player's card for boosted-PP scoring. */
export function landCardToSlotInput(card: PlayerLandCard): SlotInput {
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
    landBasePP: card.landBasePP,
  };
}

/**
 * Score a card on a specific plot: full plot-boosted PP (terrain + biome +
 * plot multipliers) via the planner calc, normalized into a SpotCardVM ready
 * to display in a CardTile and stage as a worker.
 */
export function scoreLandCard(
  card: PlayerLandCard,
  deed: DeedComplete
): SpotCardVM {
  const slot = landCardToSlotInput(card);
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
    lastUsedDate: card.lastUsedDate,
    bloodline: card.bloodline,
    landBoosts: card.landBoost,
    landBasePP: basePP,
    landBoostedPP: boostedPP,
    terrainBoost: bestTerrainBonusPct(
      plot.deedType,
      card.element,
      card.subElement
    ),
    fromChain: false,
    onWagon: card.onWagon,
    inSet: card.inSet,
    isListed: card.isListed && card.owned, // only show listed if owned (not delegated)
    isOnCooldown: isCooldownActive(card.landCooldownDate || card.survivalDate),
  };
}

/** Minimal card shape needed to build a planner SlotInput. */
type SlotCardLike = Pick<
  SpotCardVM,
  | "set"
  | "rarity"
  | "bcx"
  | "foil"
  | "element"
  | "secondaryElement"
  | "bloodline"
  | "landBoosts"
  | "landBasePP"
> & { slot?: number; uid?: string };

function spotCardToSlotInput(card: SlotCardLike, index: number): SlotInput {
  return {
    id: card.slot ?? index + 1,
    uid: card.uid,
    set: card.set as CardSetNameLandValid,
    rarity: card.rarity,
    bcx: card.bcx,
    foil: cardFoilOptions[card.foil] ?? "regular",
    element: card.element,
    secondaryElement: card.secondaryElement,
    bloodline: (card.bloodline ?? "Unknown") as CardBloodline,
    landBoosts: card.landBoosts ?? undefined,
    landBasePP: card.landBasePP,
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
  rationingLite: boolean;
  captureRate: number | null;
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
  spsRatio: number,
  overrides?: PlotBoostOverrides,
  regionTax: RegionTax[] | null = null
): PlotProjection {
  const slots = workers.map((w, i) => spotCardToSlotInput(w, i));
  const plot = deedToPlotPlannerData(deed, slots, overrides);
  const { totalBasePP, totalBoostedPP } = calcTotalPP(plot);

  const captureRate = calcCaptureRate(plot.worksiteType, totalBoostedPP);

  const info = calcProductionInfo(
    totalBasePP,
    totalBoostedPP,
    plot,
    prices,
    spsRatio,
    regionTax,
    captureRate
  );

  const rationingLite = Boolean(
    slots.find((s) => s.landBoosts?.liteConsumeGrainDiscount)
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
    rationingLite,
    captureRate,
  };
}

export interface WorkerPlanPlotProjection {
  current: PlotProjection;
  next: PlotProjection;
  selectedPPByUid: Record<string, { basePP: number; boostedPP: number }>;
}

/** Projects the added cards alongside exact current slot occupants. */
export function projectWorkerPlanPlot(
  deed: DeedComplete,
  currentWorkers: WorkerPlanPlotCard[],
  picks: WorkerPlanPick[],
  emptySlots: number[],
  prices: Prices,
  spsRatio: number,
  regionTax: RegionTax[] | null
): WorkerPlanPlotProjection {
  // A pick without a free slot is not staked, so it is not projected either
  // (and must not borrow an occupied slot id).
  const selectedCards = picks
    .slice(0, emptySlots.length)
    .map((pick, index) => ({
      uid: pick.card_uid,
      name: pick.card_name,
      set: pick.card_set,
      rarity: pick.rarity,
      bcx: pick.bcx,
      foil: pick.foil,
      element: pick.element,
      secondaryElement: pick.secondary_element,
      bloodline: pick.bloodline,
      landBoosts: pick.land_boosts,
      landBasePP: pick.land_base_pp,
      slot: emptySlots[index],
    }));
  const current = projectPlot(
    deed,
    currentWorkers,
    prices,
    spsRatio,
    undefined,
    regionTax
  );
  const next = projectPlot(
    deed,
    [...currentWorkers, ...selectedCards],
    prices,
    spsRatio,
    undefined,
    regionTax
  );

  const slots = [...currentWorkers, ...selectedCards].map((card, index) =>
    spotCardToSlotInput(card, index)
  );
  const plot = deedToPlotPlannerData(deed, slots);
  const selectedPPByUid: WorkerPlanPlotProjection["selectedPPByUid"] = {};
  for (const card of selectedCards) {
    const slot = slots.find((candidate) => candidate.uid === card.uid);
    if (!slot) continue;
    const pp = computeSlot(slot, plot);
    selectedPPByUid[card.uid] = {
      basePP: pp.basePP,
      boostedPP: pp.boostedPP,
    };
  }

  return { current, next, selectedPPByUid };
}
