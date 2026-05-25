// === Dry-run result (shared across bulk action hooks) ===

import { BiomeModifiers } from "@/lib/utils/cardUtil";

export type { BiomeModifiers };

export interface DryRunResult {
  title: string;
  log: string[];
}

// === App-level constants (not stored per player) ===

export const SERVICE_FEE_PCT = 2;
export const SERVICE_FEE_RECIPIENT = "beaker007";
export const SERVICE_FEE_RECIPIENT_REGION = "PR-CEF-65"; // beaker007's fee collection region

/**
 * Daily maximum fee per resource per account.
 *
 * Ratios follow in-game relative values:
 *   1 Iron = 40 Grain, 1 Stone = 10 Grain, 1 Wood = 4 Grain
 *
 * Symbols not listed (e.g. SPS, AURA) have no daily cap.
 */
export const DAILY_FEE_CAPS: Record<string, number> = {
  GRAIN: 40_000,
  WOOD: 10_000,
  STONE: 4_000,
  IRON: 1_000,
};

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

// === Post-Harvest strategy ===

export type PostHarvestStrategy = "accumulate" | "add_to_pool" | "sell_for_dec";
export const DEFAULT_POST_HARVEST_STRATEGY: PostHarvestStrategy = "accumulate";
export const DEFAULT_POST_HARVEST_EXCLUDED_RESOURCES: string[] = [];
export const POST_HARVEST_STRATEGY_LABELS: Record<PostHarvestStrategy, string> =
  {
    accumulate: "Accumulate (do nothing)",
    add_to_pool: "Add to liquidity pool (sell 50% for DEC, add both to pool)",
    sell_for_dec: "Sell all for DEC",
  };

export interface PostHarvestActionSummary {
  type: "sell_for_dec" | "add_to_pool";
  region_uid: string;
  symbol: string;
  resource_in: number;
  dec_amount: number;
}

// === Rental strategy ===

export type RentalStrategy = "highest_pp_per_dec";
export const DEFAULT_RENTAL_STRATEGY: RentalStrategy = "highest_pp_per_dec";
export const RENTAL_STRATEGY_LABELS: Record<RentalStrategy, string> = {
  highest_pp_per_dec: "Highest base_pp per DEC",
};

export interface RentalConfig {
  strategy: RentalStrategy;
  /** Absolute DEC budget across all picks for the whole run. 0 = no limit. */
  max_total_dec: number;
  /** Max DEC/day per single rented card. 0 = no limit. */
  max_dec_per_day_per_worker: number;
  /** Minimum land_base_pp per card. 0 = no minimum. */
  min_land_base_pp: number;
  /** Minimum foil rank (0=Regular). Cards below this are skipped. */
  min_foil: number;
}

export const DEFAULT_RENTAL_CONFIG: RentalConfig = {
  strategy: DEFAULT_RENTAL_STRATEGY,
  max_total_dec: 0,
  max_dec_per_day_per_worker: 0,
  min_land_base_pp: 0,
  min_foil: 0,
};

// === Rental eligibility (computed from region data) ===
export interface RentalEligiblePlot {
  deed_uid: string;
  plot_id: number;
  plot_number: number;
  tract_number: number;
  region_uid: string;
  region_number: number;
  resource_symbol: string | null;
  worker_count: number;
  max_workers: number;
  empty_slots: number;
  is_powered: boolean;
  biome_modifiers: BiomeModifiers;
}

export interface RentalEligibilityResult {
  eligible: RentalEligiblePlot[];
  unpoweredSkipped: RentalEligiblePlot[];
}

// === Rental plan (dry run output) ===

export interface RentalPlanPick {
  market_id: string;
  card_uid: string;
  card_detail_id: number;
  card_name: string;
  edition: number;
  foil: number;
  gold: boolean;
  level: number;
  color: string;
  biome_modifier: number;
  land_base_pp: number;
  effective_pp: number;
  buy_price_per_day: number;
  rental_days: number;
  total_dec: number;
  pp_per_dec: number;
  seller: string;
  expiration_date: string;
  card_image_url: string;
}

export interface RentalPlanItem {
  plot: RentalEligiblePlot;
  picks: RentalPlanPick[];
  slots_filled: number;
  slots_skipped: number;
  plot_total_dec: number;
  skip_reason: string | null;
}

export interface RentalPlanTotals {
  plots_total: number;
  plots_with_picks: number;
  slots_total: number;
  slots_filled: number;
  total_dec: number;
}

export interface RentalPlan {
  config: RentalConfig;
  items: RentalPlanItem[];
  totals: RentalPlanTotals;
  warnings: string[];
  rental_days: number | null;
  rental_days_source: string;
}

// === Config (DB — per player) ===

export interface LandManagerConfig {
  player: string;
  enabled_regions: number[];
  make_harvestable_strategies: MakeHarvestableStrategy[];
  fee_accepted: boolean;
  post_harvest_strategy: PostHarvestStrategy;
  post_harvest_excluded_resources: string[];
  mythic_fee_accepted: boolean;
  rental: RentalConfig;
}

// === Mythic deeds (Keeps & Castles) ===

export interface MythicDeed {
  deed_uid: string;
  region_uid: string;
  region_number: number;
  tract_number: number;
  kingdom_type: "keep" | "castle";
  last_action_time: Date | null;
  estimated_totem_chance: number | null;
  taxes: import("@/types/splTaxes").SplTax[];
  capacity: number;
}

export interface MythicHarvestResult {
  deed_uid: string;
  region_uid: string;
  region_number?: number;
  tract_number?: number;
  kingdom_type: "keep" | "castle";
  tokens: { token: string; received: string }[];
  fragment_found: boolean;
  fragment_chance: number;
}

// === Action summary for make-harvestable log ===

export interface ActionSummary {
  type: "transfer" | "swap" | "buy_dec";
  from_region: string;
  to_region: string;
  from_symbol: string;
  to_symbol: string;
  in_amount: number;
  out_amount: number;
}
