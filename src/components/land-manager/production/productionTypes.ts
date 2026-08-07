import { DeedComplete } from "@/types/deed";

/** A flat, render-ready view of one plot for the Production table. */
export interface ProductionRow {
  deedUid: string;
  regionUid: string;
  regionNumber: number;
  regionName: string;
  rarity: string;
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

export type ProductionSortKey =
  | "label"
  | "rarity"
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
    rarity: (deed.rarity ?? "common").toLowerCase(),
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
      case "rarity":
        cmp = rarityRank(a.rarity) - rarityRank(b.rarity);
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
