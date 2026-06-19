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
  buy: BuyConfig = DEFAULT_BUY_CONFIG
): Promise<BuyExecutionPlan> {
  const eligibility = await getWorkerEligibility(enabledRegions);
  const plan = await buildBuyPlan(eligibility.eligible, buy);
  const emptySlotsByDeed = await fetchEmptySlotsByDeed(plan);

  return { plan, emptySlotsByDeed };
}
