// === Dry-run result (shared across bulk action hooks) ===

export interface DryRunResult {
  title: string;
  log: string[];
  ops: [string, object][];
}

// === App-level constants (not stored per player) ===

export const SERVICE_FEE_PCT = 2;
export const SERVICE_FEE_RECIPIENT = "beaker007";
export const SERVICE_FEE_RECIPIENT_REGION = "PR-CEF-65"; // beaker007's fee collection region
export const FEE_EXEMPT_REGIONS: number[] = [65];

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

// === Post-Harvest strategy ===

export type PostHarvestStrategy = "accumulate" | "add_to_pool" | "sell_for_dec";
export const DEFAULT_POST_HARVEST_STRATEGY: PostHarvestStrategy = "accumulate";
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

// === Config (DB — per player) ===

export interface LandManagerConfig {
  player: string;
  enabled_regions: number[];
  make_harvestable_strategies: MakeHarvestableStrategy[];
  fee_accepted: boolean;
  post_harvest_strategy: PostHarvestStrategy;
  mythic_fee_accepted: boolean;
}

// === Mythic deeds (Keeps & Castles) ===

export interface MythicDeed {
  deed_uid: string;
  region_uid: string;
  region_number: number;
  kingdom_type: "keep" | "castle";
  last_action_time: Date | null;
  estimated_totem_chance: number | null;
  taxes: import("@/types/splTaxes").SplTax[];
  capacity: number;
}

export interface MythicHarvestResult {
  deed_uid: string;
  region_uid: string;
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
