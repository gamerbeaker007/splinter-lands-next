import { DeedComplete } from "@/types/deed";
import {
  DeedType,
  MagicType,
  PlotPlannerData,
  PlotRarity,
  PlotStatus,
  RUNI_FLAT_ADD,
  RuniTier,
  SlotInput,
  TitleTier,
  titleModifiers,
  TotemTier,
  totemModifiers,
  WorksiteType,
} from "@/types/planner";

/** Map a staking-detail boost value back to its tier name via a modifier map. */
function tierForBoost<T extends string>(
  modifiers: Record<T, number>,
  boost: number | null | undefined,
  fallback: T
): T {
  if (!boost) return fallback;
  const found = (Object.entries(modifiers) as [T, number][]).find(
    ([, value]) => value === boost
  );
  return found?.[0] ?? fallback;
}

/**
 * Build a {@link PlotPlannerData} from a loaded deed so the planner calcs
 * (computeSlot / calcBoostedPP) can score candidate cards on this plot.
 * `cardInput` is the set of cards being evaluated/staged. The terrain modifier
 * (derived from the deed's geography) already encodes the plot's biome boost.
 *
 * Plot-level boost tiers (title/totem/runi) are resolved from the deed's
 * staking detail; this mirrors the mapping used by the playground.
 */
/** Override the plot-level boost tiers (e.g. from a staged, not-yet-saved config). */
export interface PlotBoostOverrides {
  title?: TitleTier;
  totem?: TotemTier;
  runi?: RuniTier;
}

export function deedToPlotPlannerData(
  deed: DeedComplete,
  cardInput: SlotInput[],
  overrides?: PlotBoostOverrides
): PlotPlannerData {
  const st = deed.stakingDetail;

  let runi: RuniTier = "none";
  if (st?.runi_boost && st.total_runi_boost_pp) {
    runi = st.total_runi_boost_pp > RUNI_FLAT_ADD.regular ? "regular" : "gold";
  }

  return {
    plotRarity: (deed.rarity ?? "common") as PlotRarity,
    deedType: (deed.deed_type?.toLowerCase() ?? "bog") as DeedType,
    magicType: (deed.magic_type ?? null) as MagicType,
    plotStatus: (deed.plot_status ?? "natural") as PlotStatus,
    title:
      overrides?.title ??
      tierForBoost<TitleTier>(titleModifiers, st?.title_boost, "none"),
    totem:
      overrides?.totem ??
      tierForBoost<TotemTier>(totemModifiers, st?.totem_boost, "none"),
    runi: overrides?.runi ?? runi,
    worksiteType: (deed.worksite_type ?? "") as WorksiteType,
    regionNumber: deed.region_number,
    tractNumber: deed.tract_number,
    cardInput,
  };
}
