import { DeedComplete } from "@/types/deed";

/** A flat, render-ready view of one plot for the Production table. */
export interface ProductionRow {
  deedUid: string;
  regionUid: string;
  regionNumber: number;
  regionName: string;
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
  powered: boolean;
  workerCount: number;
  maxWorkers: number;

  basePP: number;
  /* Total PP, including terrain boost after cap*/
  boostedPP: number;
  /** True when the plot has anything staked (gates the Empty action). */
  hasStakedItems: boolean;
  /** True when the deed is listed on the market (can't be reconfigured). */
  listed: boolean;
}

export type PoweredFilter = "all" | "powered" | "unpowered";
export type WorkerFilter =
  | "all"
  | "hasWorkers"
  | "hasEmptySlots"
  | "fullyEmpty";

export interface ProductionFilterState {
  regions: number[];
  worksiteTypes: string[];
  powered: PoweredFilter;
  workers: WorkerFilter;
}

export const DEFAULT_PRODUCTION_FILTERS: ProductionFilterState = {
  regions: [],
  worksiteTypes: [],
  powered: "all",
  workers: "all",
};

export type ProductionSortKey =
  | "label"
  | "regionNumber"
  | "worksiteType"
  | "rewardsPerHour"
  | "netDEC"
  | "basePP"
  | "boostedPP"
  | "powered"
  | "workerCount";

export type SortDirection = "asc" | "desc";

/** Display label for a worksite type ("" → "Undeveloped"). */
export function worksiteLabel(worksiteType: string): string {
  return worksiteType && worksiteType.trim() !== ""
    ? worksiteType
    : "Undeveloped";
}

/** Build a ProductionRow from an enriched DeedComplete. */
export function toProductionRow(deed: DeedComplete): ProductionRow {
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
    tractNumber: deed.tract_number,
    plotNumber: deed.plot_number,
    label: `P-${deed.region_number}-${deed.tract_number}-${deed.plot_number}`,
    worksiteType: deed.worksite_type ?? "",
    tokenSymbol: ws?.token_symbol ?? "",
    rewardsPerHour: ws?.rewards_per_hour ?? 0,
    netDEC: deed.productionInfo?.netDEC ?? 0,
    basePP: st?.total_base_pp_after_cap ?? 0,
    boostedPP: st?.total_harvest_pp ?? 0,
    powered,
    workerCount,
    maxWorkers: st?.max_workers_allowed ?? 0,
    hasStakedItems,
    listed: deed.listed ?? false,
  };
}

/** Unique worksite types present in the rows (sorted, undeveloped last). */
export function availableWorksiteTypes(rows: ProductionRow[]): string[] {
  const set = new Set(rows.map((r) => r.worksiteType));
  return [...set].sort((a, b) => {
    if (a === "") return 1;
    if (b === "") return -1;
    return a.localeCompare(b);
  });
}

/** Unique region numbers present in the rows (ascending). */
export function availableRegions(rows: ProductionRow[]): number[] {
  return [...new Set(rows.map((r) => r.regionNumber))].sort((a, b) => a - b);
}

export function filterRows(
  rows: ProductionRow[],
  f: ProductionFilterState
): ProductionRow[] {
  return rows.filter((r) => {
    if (f.regions.length > 0 && !f.regions.includes(r.regionNumber))
      return false;
    if (f.worksiteTypes.length > 0 && !f.worksiteTypes.includes(r.worksiteType))
      return false;
    if (f.powered === "powered" && !r.powered) return false;
    if (f.powered === "unpowered" && r.powered) return false;
    if (f.workers === "hasWorkers" && r.workerCount === 0) return false;
    if (f.workers === "hasEmptySlots" && r.workerCount >= r.maxWorkers)
      return false;
    if (f.workers === "fullyEmpty" && r.workerCount !== 0) return false;
    return true;
  });
}

export function sortRows(
  rows: ProductionRow[],
  key: ProductionSortKey,
  dir: SortDirection
): ProductionRow[] {
  const mul = dir === "asc" ? 1 : -1;
  const sorted = [...rows].sort((a, b) => {
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
    }
    return cmp * mul;
  });
  return sorted;
}
