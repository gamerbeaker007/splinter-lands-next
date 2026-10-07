import { isRowComplete } from "@/lib/shared/customPlanValidation";
import {
  CUSTOM_PLAN_ACTION_LABELS,
  CustomPlanActionType,
  CustomPlanRowDraft,
  CustomPlanRowValidation,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";

export type CustomPlanRowStatus =
  "new" | "valid" | "skipped" | "error" | "incomplete";

export function getCustomPlanRowStatus(
  draft: CustomPlanRowDraft,
  validation: CustomPlanRowValidation | null,
  isEmptyRow?: boolean
): CustomPlanRowStatus {
  if (isEmptyRow) return "new";
  if (!isRowComplete(draft)) return "incomplete";
  if (validation?.error) return "error";
  if (validation?.skipped) return "skipped";
  if (validation?.valid) return "valid";
  return "incomplete";
}

export function regionName(
  regions: SplProductionOverviewRegion[],
  uid: string
): string {
  if (!uid) return "…";
  const region = regions.find((r) => r.region_uid === uid);
  return region?.name || uid;
}

/** The resource a row is "about", used for its icon. */
export function rowResourceSymbol(draft: CustomPlanRowDraft): string {
  if (draft.action_type === "stake_dec") return "DEC";
  return draft.from_resource;
}

/**
 * One-line, human-readable description of a row, e.g.
 * "Pool 100% of WOOD from Quegmoor". Unset fields render as "…".
 */
export function describeCustomPlanRow(
  draft: CustomPlanRowDraft,
  regions: SplProductionOverviewRegion[]
): string {
  const actionType = draft.action_type as CustomPlanActionType | "";
  if (!actionType) return "New action";

  const res = draft.from_resource || "…";
  const amount = draft.amount || "…";
  const from = regionName(regions, draft.from_region_uid);
  const to = regionName(regions, draft.to_region_uid);
  const amountOf = (symbol: string) =>
    draft.amount_type === "pct"
      ? `${amount}% of ${symbol}`
      : `${amount} ${symbol}`;

  switch (actionType) {
    case "transfer":
      return `Transfer ${amountOf(res)} from ${from} to ${to}`;
    case "pool":
      return `Pool ${amountOf(res)} from ${from}`;
    case "buy":
      return `Buy ${amount} ${res} into ${to}`;
    case "sell":
      return `Sell ${amountOf(res)} from ${from}`;
    case "swap":
      return `Swap ${amountOf(res)} from ${from} to ${draft.to_resource || "…"} in ${to}`;
    case "pool_withdraw":
      return `Withdraw ${amountOf(res)} from pool to ${to}`;
    case "stake_dec":
      return `Stake ${amountOf("DEC")} in ${to}`;
    default:
      return CUSTOM_PLAN_ACTION_LABELS[actionType] ?? actionType;
  }
}

/** Case-insensitive match of a row against the Actions search box. */
export function rowMatchesSearch(
  draft: CustomPlanRowDraft,
  regions: SplProductionOverviewRegion[],
  query: string
): boolean {
  if (!query) return true;
  const haystack = [
    describeCustomPlanRow(draft, regions),
    draft.from_resource,
    draft.to_resource,
    regionName(regions, draft.from_region_uid),
    regionName(regions, draft.to_region_uid),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}
