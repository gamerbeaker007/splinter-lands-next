import {
  ConfigCard,
  PlotConfigureData,
} from "@/lib/backend/actions/land-manager/production-actions";
import {
  StakeChangeInput,
  STAKE_TYPE_UID_LAND_POWER_CORE,
  STAKE_TYPE_UID_LAND_RUNI,
  STAKE_TYPE_UID_LAND_TITLE,
  STAKE_TYPE_UID_LAND_TOTEM,
  STAKE_TYPE_UID_LAND_WORKER,
} from "@/lib/shared/operations/opBuilders";
import { PlotBoostOverrides } from "@/lib/frontend/utils/deedToPlotPlanner";
import {
  CardElement,
  CardRarity,
  TitleTier,
  titleModifiers,
  TotemTier,
  totemModifiers,
} from "@/types/planner";

/** A card occupying a spot (worker or runi), staged or already on-chain. */
export interface SpotCardVM {
  uid: string;
  name: string;
  rarity: CardRarity;
  set: string;
  element: CardElement;
  secondaryElement: CardElement | null;
  edition: number;
  /** Numeric foil id (CardTile/stake format). */
  foil: number;
  bcx: number;
  maxBcx: number;
  basePP: number;
  boostedPP: number;
  terrainBoost: number;
  /** True when this is the currently-staked occupant (no change needed). */
  fromChain: boolean;
  onWagon: boolean;
  inSet: boolean;
}

/** An item occupying a spot (power core / totem / title). */
export interface SpotItemVM {
  uid: string;
  name: string;
  stakeTypeUid: string;
  boost: number;
  fromChain: boolean;
}

/** The desired (staged) contents of every spot on a plot. */
export interface StagedConfig {
  powerCore: SpotItemVM | null;
  runi: SpotCardVM | null;
  /** One entry per worker slot; length === maxWorkers. */
  workers: (SpotCardVM | null)[];
  totem: SpotItemVM | null;
  title: SpotItemVM | null;
}

/** A land plot has at most 5 worker slots (when powered). */
export const MAX_WORKER_SLOTS = 5;

function cardToVM(card: ConfigCard): SpotCardVM {
  return { ...card, fromChain: true, onWagon: card.onWagon, inSet: card.inSet };
}

/**
 * Build the initial staged config from what is currently on-chain. The worker
 * array is always {@link MAX_WORKER_SLOTS} long; how many slots are actually
 * editable depends on whether the plot is powered (decided by the panel).
 */
export function initStagedConfig(data: PlotConfigureData): StagedConfig {
  const workers: (SpotCardVM | null)[] = Array.from(
    { length: MAX_WORKER_SLOTS },
    () => null
  );
  for (const w of data.workers) {
    // Worker slots are 1-based on-chain.
    const idx = w.slot - 1;
    if (idx >= 0 && idx < MAX_WORKER_SLOTS) workers[idx] = cardToVM(w);
  }
  return {
    powerCore: data.powerCore ? { ...data.powerCore, fromChain: true } : null,
    runi: data.runi ? cardToVM(data.runi) : null,
    workers,
    totem: data.totem ? { ...data.totem, fromChain: true } : null,
    title: data.title ? { ...data.title, fromChain: true } : null,
  };
}

function itemChanged(
  current: SpotItemVM | null,
  staged: SpotItemVM | null
): boolean {
  return (current?.uid ?? null) !== (staged?.uid ?? null);
}

/**
 * Diff the staged config against the on-chain state into a single
 * stake/unstake op input. Replacing a spot yields both an unstake (old) and a
 * stake (new); clearing yields an unstake; filling an empty yields a stake.
 */
export function diffStagedConfig(
  current: PlotConfigureData,
  staged: StagedConfig
): StakeChangeInput {
  const stakeCards: NonNullable<StakeChangeInput["stakeCards"]> = [];
  const stakeItems: NonNullable<StakeChangeInput["stakeItems"]> = [];
  const unstakeCardUids: string[] = [];
  const unstakeItemUids: string[] = [];

  // ── Items (power core / totem / title) ──
  const itemSpots: {
    cur: { uid: string } | null;
    next: SpotItemVM | null;
    stakeTypeUid: string;
  }[] = [
    {
      cur: current.powerCore,
      next: staged.powerCore,
      stakeTypeUid: STAKE_TYPE_UID_LAND_POWER_CORE,
    },
    {
      cur: current.totem,
      next: staged.totem,
      stakeTypeUid: STAKE_TYPE_UID_LAND_TOTEM,
    },
    {
      cur: current.title,
      next: staged.title,
      stakeTypeUid: STAKE_TYPE_UID_LAND_TITLE,
    },
  ];
  for (const spot of itemSpots) {
    const curVM = spot.cur ? { uid: spot.cur.uid, fromChain: true } : null;
    if (itemChanged(curVM as SpotItemVM | null, spot.next)) {
      if (spot.cur) unstakeItemUids.push(spot.cur.uid);
      if (spot.next)
        stakeItems.push({
          item_uid: spot.next.uid,
          stake_type_uid: spot.stakeTypeUid,
        });
    }
  }

  // ── Runi (card, no slot) ──
  const curRuniUid = current.runi?.uid ?? null;
  const nextRuniUid = staged.runi?.uid ?? null;
  if (curRuniUid !== nextRuniUid) {
    if (curRuniUid) unstakeCardUids.push(curRuniUid);
    if (staged.runi)
      stakeCards.push({
        card_uid: staged.runi.uid,
        stake_type_uid: STAKE_TYPE_UID_LAND_RUNI,
      });
  }

  // ── Workers (cards with 1-based slots) ──
  staged.workers.forEach((next, idx) => {
    const slot = idx + 1;
    const cur = current.workers.find((w) => w.slot === slot) ?? null;
    const curUid = cur?.uid ?? null;
    const nextUid = next?.uid ?? null;
    if (curUid !== nextUid) {
      if (curUid) unstakeCardUids.push(curUid);
      if (next)
        stakeCards.push({
          card_uid: next.uid,
          stake_type_uid: STAKE_TYPE_UID_LAND_WORKER,
          slot,
        });
    }
  });

  return { stakeCards, stakeItems, unstakeCardUids, unstakeItemUids };
}

function tierForBoost<T extends string>(
  modifiers: Record<T, number>,
  boost: number | null | undefined,
  fallback: T
): T {
  if (!boost) return fallback;
  return (
    (Object.entries(modifiers) as [T, number][]).find(
      ([, value]) => value === boost
    )?.[0] ?? fallback
  );
}

/**
 * Resolve the plot-level boost tiers (title/totem/runi) from a config's item
 * spots, for feeding the planner calc. Works for both the on-chain config and
 * a staged config (both expose `boost` on items and `foil` on the runi card).
 */
export function boostOverrides(input: {
  title: { boost: number } | null;
  totem: { boost: number } | null;
  runi: { foil: number } | null;
}): PlotBoostOverrides {
  return {
    title: tierForBoost<TitleTier>(titleModifiers, input.title?.boost, "none"),
    totem: tierForBoost<TotemTier>(totemModifiers, input.totem?.boost, "none"),
    runi: input.runi ? (input.runi.foil > 0 ? "gold" : "regular") : "none",
  };
}

/** True when the staged config differs from on-chain (Save would do something). */
export function stagedHasChanges(input: StakeChangeInput): boolean {
  return (
    (input.stakeCards?.length ?? 0) > 0 ||
    (input.stakeItems?.length ?? 0) > 0 ||
    (input.unstakeCardUids?.length ?? 0) > 0 ||
    (input.unstakeItemUids?.length ?? 0) > 0
  );
}
