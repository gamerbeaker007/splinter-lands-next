import {
  SplHarvestableResource,
  SplProductionOverviewRegion,
} from "@/types/spl/landManager";

// === App-level constants (not stored per player) ===

export const SERVICE_FEE_PCT = 5.0;
export const SERVICE_FEE_RECIPIENT = "beaker007";
export const SERVICE_FEE_RECIPIENT_REGION = "PR-CEF-65"; // beaker007's fee collection region
export const FEE_EXEMPTIONS: Array<{ region_id: number; tract_id: number }> = [
  { region_id: 65, tract_id: 3 },
];

// Trade hub takes 10% on every transfer/swap (same-symbol transfer or cross-symbol swap).
// When the live quote endpoint is unavailable, apply this rate as the fallback.
export const TRADE_HUB_FEE_PCT = 10;

// === Make Harvestable strategy ===

export type MakeHarvestableStrategy = "transfer" | "swap" | "buy_dec";

export const DEFAULT_MAKE_HARVESTABLE_STRATEGIES: MakeHarvestableStrategy[] = [
  "transfer",
  "swap",
  "buy_dec",
];

export const MAKE_HARVESTABLE_STRATEGY_LABELS: Record<
  MakeHarvestableStrategy,
  string
> = {
  transfer: "Transfer (move resource from another region)",
  swap: "Swap (trade surplus resource for needed one)",
  buy_dec: "Buy with DEC",
};

// === Config (DB — per player) ===

export interface LandManagerConfig {
  player: string;
  enabled_regions: number[];
  make_harvestable_strategies: MakeHarvestableStrategy[];
}

// === Region with harvestable data (combined for UI) ===

export interface RegionWithHarvest {
  region: SplProductionOverviewRegion;
  harvestable: SplHarvestableResource[];
  loading: boolean;
  error: string | null;
}
