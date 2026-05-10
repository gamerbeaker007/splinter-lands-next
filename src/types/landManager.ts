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

// === Player resource balance ===

export interface PlayerResourceBalance {
  token_symbol: string;
  balance: number;
}

// === Region resource balance ===

export interface RegionResourceBalance {
  grain: number;
  wood: number;
  stone: number;
  iron: number;
  aura: number;
}
// === Production Overview API ===

export interface ProductionOverviewPlot {
  rarity: string;
  plot_status: string;
  rarity_count: string;
  active: string;
}

export interface ProductionOverviewRegion {
  player: string;
  region_uid: string;
  name: string;
  region_number: number;
  plots_owned: number;
  dark_energy_required: number;
  active_worksites: number;
  wood_per_hr: number;
  wood_pp: number;
  wood_worksites: number;
  wood_ready: number;
  stone_per_hr: number;
  stone_pp: number;
  stone_worksites: number;
  stone_ready: number;
  iron_per_hr: number;
  iron_pp: number;
  iron_worksites: number;
  iron_ready: number;
  sps_per_hr: number;
  sps_pp: number;
  sps_worksites: number;
  sps_ready: number;
  grain_per_hr: number;
  grain_pp: number;
  grain_worksites: number;
  grain_ready: number;
  research_per_hr: number;
  research_pp: number;
  research_worksites: number;
  research_ready: number;
  aura_per_hr: number;
  aura_pp: number;
  aura_worksites: number;
  aura_ready: number;
  dark_energy_staked: number;
  plots_ready_to_harvest: number;
  last_claimed: string;
  grain_required: number;
  grain_req_per_hour: number;
}

export interface ProductionOverviewResponse {
  status: string;
  data: {
    plot_overview: {
      player: string;
      production: ProductionOverviewPlot[];
    };
    productivity_overview: {
      work_sites: unknown[];
    };
    dark_energy: {
      total_dec_staked: number;
    };
    regions: {
      items: ProductionOverviewRegion[];
    };
  };
}

// === Harvestable Resources API ===

export interface HarvestableResource {
  amount_claimable: number;
  grain_required_for_food: number;
  wood_required: number;
  stone_required: number;
  iron_required: number;
  token_symbol: string;
}

export interface HarvestableResponse {
  status: string;
  data: HarvestableResource[];
}

// === Config (DB — per player) ===

export interface LandManagerConfig {
  player: string;
  enabled_regions: number[];
  make_harvestable_strategies: MakeHarvestableStrategy[];
}

// === Region with harvestable data (combined for UI) ===

export interface RegionWithHarvest {
  region: ProductionOverviewRegion;
  harvestable: HarvestableResource[];
  loading: boolean;
  error: string | null;
}
