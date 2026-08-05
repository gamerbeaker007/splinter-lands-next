"use server";
import {
  fetchEmptySlotsByDeed,
  getWorkerEligibility,
} from "@/lib/backend/actions/land-manager/worker-actions";
import { buildBuyPlan } from "@/lib/backend/services/landBuyService";
import { BuyConfig, BuyPlan, DEFAULT_BUY_CONFIG } from "@/types/landManager";

export interface BuyExecutionPlan {
  plan: BuyPlan;
  // deed_uid -> ordered list of empty slot numbers (1-based).
  emptySlotsByDeed: Record<string, number[]>;
}

/**
 * Buy counterpart of getRentalExecutionPlan. Eligible plots (powered, with
 * empty worker slots) are identical to the rental flow, so we reuse
 * getRentalEligibility and only swap the plan builder.
 */
export async function getBuyExecutionPlan(
  enabledRegions: number[],
  buy: BuyConfig = DEFAULT_BUY_CONFIG,
  filteredDeedUids?: string[]
): Promise<BuyExecutionPlan> {
  const eligibility = await getWorkerEligibility(enabledRegions);
  let eligible = eligibility.eligible;
  if (filteredDeedUids && filteredDeedUids.length > 0) {
    const uidSet = new Set(filteredDeedUids);
    eligible = eligible.filter((p) => uidSet.has(p.deed_uid));
  }
  const plan = await buildBuyPlan(eligible, buy);
  const emptySlotsByDeed = await fetchEmptySlotsByDeed(plan);

  return { plan, emptySlotsByDeed };
}
