"use server";

import {
  loadBuyPlanCandidates,
  loadRentalPlanCandidates,
} from "@/lib/backend/services/landWorkerPlanService";
import type {
  PlanCaps,
  PlotBiomeModifiers,
  SeasonDaysResult,
  WorkerPlanCandidates,
} from "@/lib/shared/workerPlan";

/**
 * Candidate selection for the browser-built worker plans
 * (`buildRentalExecutionPlan` / `buildBuyExecutionPlan`). Only shared,
 * server-cached data is read here (grouped market, card details, settings /
 * DEC price); the player's plots arrive as their biome modifiers and the live
 * listings are fetched by the browser.
 */
export async function getRentalPlanCandidates(
  biomeModifiers: PlotBiomeModifiers[],
  caps: PlanCaps
): Promise<WorkerPlanCandidates<SeasonDaysResult>> {
  return loadRentalPlanCandidates(biomeModifiers, caps);
}

export async function getBuyPlanCandidates(
  biomeModifiers: PlotBiomeModifiers[],
  caps: PlanCaps
): Promise<WorkerPlanCandidates<number>> {
  return loadBuyPlanCandidates(biomeModifiers, caps);
}
