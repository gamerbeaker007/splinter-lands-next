import { getWorksitePlotState } from "@/lib/shared/worksiteEligibility";
import {
  BiomeModifiers,
  getBiomeModifiersFromStakingDetail,
} from "@/lib/utils/cardUtil";
import { DeedComplete } from "@/types/deed";
import { WorksiteType } from "@/types/planner";

/** A flat, render-ready view of one plot for the Production table. */
export interface ProductionRow {
  deedUid: string;
  regionUid: string;
  regionNumber: number;
  regionName: string;
  rarity: string;
  plotStatus: string;
  magicType: string;
  tractNumber: number;
  plotNumber: number;
  /** P-{region}-{tract}-{plot}. */
  label: string;
  /** Worksite type, "" when undeveloped. */
  worksiteType: string;
  /** Produced resource symbol (e.g. GRAIN, TAX). */
  tokenSymbol: string;
  rewardsPerHour: number;
  netDEC: number;
  /**
   * True when netDEC is an estimate rather than a derived rate: castle/keep tax
   * income depends on the plots in the region/tract actually being harvested.
   */
  netDecEstimated: boolean;
  powered: boolean;
  workerCount: number;
  maxWorkers: number;

  basePP: number;
  /* Total PP, including terrain boost after cap*/
  boostedPP: number;
  /** True when the plot has anything staked (gates the Empty action). */
  hasStakedItems: boolean;
  /** True when the deed is listed on the market (can't be reconfigured). */
  totemBoost: number;
  titleBoost: number;
  listed: boolean;
  /** Positive Terrain Boosts **/
  biomeModifiers: BiomeModifiers;
  /**
   * Worksite/construction state, derived from the shared eligibility helper so
   * the table, the Change worksite dialog and the Worksite page agree. Carried
   * on the row itself — the deed data it comes from is already loaded, so the
   * table needs no extra state or request to show construction progress.
   */
  construction: RowConstruction;
}

export interface RowConstruction {
  /** A construction project exists (building OR finished-but-unfed). */
  isConstruction: boolean;
  /** Still building — projected_end is in the future. */
  isActivelyBuilding: boolean;
  /** Build finished; the workers must be fed before the worksite produces. */
  isReadyToFeed: boolean;
  /** Target of the running construction. */
  buildingWorksite: WorksiteType | null;
  /** When the build completes, epoch ms. */
  endsAtMs: number | null;
  /** Grain the region must hold to feed this worksite. */
  grainCost: number;
  /** Kingdom (KEEP/CASTLE) plot — fixed worksite, no swap possible. */
  isMythic: boolean;
  /** No worksite built yet. */
  isUndeveloped: boolean;
}

export type ProductionSortKey =
  | "label"
  | "rarity"
  | "plotStatus"
  | "regionNumber"
  | "worksiteType"
  | "rewardsPerHour"
  | "netDEC"
  | "basePP"
  | "boostedPP"
  | "powered"
  | "workerCount"
  | "totem"
  | "title";
export type SortDirection = "asc" | "desc";

/** Display label for a worksite type ("" → "Undeveloped"). */
export function worksiteLabel(worksiteType: string): string {
  return worksiteType && worksiteType.trim() !== ""
    ? worksiteType
    : "Undeveloped";
}

/**
 * Build a ProductionRow from an enriched DeedComplete.
 *
 * `nowMs` is passed in rather than read from the clock so renders stay pure and
 * so the table judges construction against the same instant as the dialogs.
 */
export function toProductionRow(
  deed: DeedComplete,
  nowMs: number
): ProductionRow {
  const plotState = getWorksitePlotState(deed, nowMs);
  const endsAtMs = deed.worksiteDetail?.projected_end
    ? new Date(deed.worksiteDetail.projected_end).getTime()
    : null;
  const st = deed.stakingDetail;
  const ws = deed.worksiteDetail;
  const powered = st?.is_powered ?? false;
  const workerCount = st?.worker_count ?? 0;
  const hasStakedItems =
    powered ||
    workerCount > 0 ||
    (st?.title_boost ?? 0) > 0 ||
    (st?.totem_boost ?? 0) > 0;

  return {
    deedUid: deed.deed_uid,
    regionUid: deed.region_uid,
    regionNumber: deed.region_number,
    regionName: deed.region_name ?? "",
    rarity: (deed.rarity ?? "common").toLowerCase(),
    plotStatus: deed.plot_status ?? "",
    magicType: deed.magic_type ?? "",
    tractNumber: deed.tract_number,
    plotNumber: deed.plot_number,
    label: `P-${deed.region_number}-${deed.tract_number}-${deed.plot_number}`,
    biomeModifiers: getBiomeModifiersFromStakingDetail(deed.stakingDetail),
    worksiteType: deed.worksite_type ?? "",
    tokenSymbol: ws?.token_symbol ?? "",
    rewardsPerHour: ws?.rewards_per_hour ?? 0,
    netDEC: deed.productionInfo?.netDEC ?? 0,
    netDecEstimated: ws?.token_symbol === "TAX",
    basePP: st?.total_base_pp_after_cap ?? 0,
    boostedPP: st?.total_harvest_pp ?? 0,
    powered,
    workerCount,
    maxWorkers: st?.max_workers_allowed ?? 0,
    hasStakedItems,
    listed: deed.listed ?? false,
    totemBoost: st?.totem_boost ?? 0,
    titleBoost: st?.title_boost ?? 0,
    construction: {
      isConstruction: plotState.isConstruction,
      isActivelyBuilding: plotState.isActivelyBuilding,
      isReadyToFeed: plotState.isReadyToFeed,
      buildingWorksite: plotState.buildingWorksite,
      endsAtMs,
      grainCost: plotState.grainCost,
      isMythic: plotState.isMythic,
      isUndeveloped: plotState.isUndeveloped,
    },
  };
}

function rarityRank(rarity: string): number {
  switch (rarity.toLowerCase()) {
    case "common":
      return 0;
    case "rare":
      return 1;
    case "epic":
      return 2;
    case "legendary":
      return 3;
    case "mythic":
      return 4;
    default:
      return 99;
  }
}

function plotStatusRank(plotStatus: string): number {
  switch (plotStatus.toLowerCase()) {
    case "neutral":
      return 0;
    case "magical":
      return 1;
    case "kingdom":
      return 2;
    default:
      return 99;
  }
}

export function sortRows(
  rows: ProductionRow[],
  key: ProductionSortKey,
  dir: SortDirection
): ProductionRow[] {
  const mul = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "label":
        cmp =
          a.regionNumber - b.regionNumber ||
          a.tractNumber - b.tractNumber ||
          a.plotNumber - b.plotNumber;
        break;
      case "regionNumber":
        cmp = a.regionNumber - b.regionNumber;
        break;
      case "rarity":
        cmp = rarityRank(a.rarity) - rarityRank(b.rarity);
        break;
      case "plotStatus":
        cmp = plotStatusRank(a.plotStatus) - plotStatusRank(b.plotStatus);
        break;
      case "worksiteType":
        cmp = worksiteLabel(a.worksiteType).localeCompare(
          worksiteLabel(b.worksiteType)
        );
        break;
      case "rewardsPerHour":
        cmp = a.rewardsPerHour - b.rewardsPerHour;
        break;
      case "netDEC":
        cmp = a.netDEC - b.netDEC;
        break;
      case "basePP":
        cmp = a.basePP - b.basePP;
        break;
      case "boostedPP":
        cmp = a.boostedPP - b.boostedPP;
        break;
      case "powered":
        cmp = Number(a.powered) - Number(b.powered);
        break;
      case "workerCount":
        cmp = a.workerCount - b.workerCount;
        break;
      case "totem":
        if (a.totemBoost === 0 && b.totemBoost !== 0) return 1;
        if (b.totemBoost === 0 && a.totemBoost !== 0) return -1;
        cmp = a.totemBoost - b.totemBoost;
        break;

      case "title":
        if (a.titleBoost === 0 && b.titleBoost !== 0) return 1;
        if (b.titleBoost === 0 && a.titleBoost !== 0) return -1;
        cmp = a.titleBoost - b.titleBoost;
        break;
    }
    return cmp * mul;
  });
}
