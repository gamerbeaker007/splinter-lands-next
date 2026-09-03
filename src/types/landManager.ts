// === Action plan (shared across bulk action hooks) ===

import { BiomeModifiers } from "@/lib/utils/cardUtil";
import { DeedComplete } from "@/types/deed";
import { CardRarity } from "./planner";

/**
 * What an action intends to do, rendered for confirmation before anything is
 * broadcast. Every bulk action hook exposes `execute(planOnly)`: `true` returns
 * this plan and touches nothing, `false` broadcasts it.
 */
export interface ActionPlan {
  title: string;
  log: string[];
}

export const MAX_ITEM_SIZE_IN_OPERATION = 100;
// Hive blocks allow at most 5 custom_json ops per account per block.
// 4 keeps us safely under that limit.
export const MAX_OPS_PER_BROADCAST = 4;
// Hive produces a new block every ~3 seconds. Waiting this long between
// consecutive broadcast batches guarantees they land in different blocks.
export const HIVE_BLOCK_MS = 3_000;

// === Donation defaults (stored per player config) ===
export const DEFAULT_DONATION_ENABLED = true;
export const DEFAULT_DONATION_PCT = 2;
export const DEFAULT_DONATION_RECIPIENT = "beaker007";
export const DEFAULT_DONATION_RECIPIENT_REGION = "PR-CEF-65";

/**
 * Daily maximum donation per resource per account.
 *
 * Ratios follow in-game relative values:
 *   1 Iron = 40 Grain, 1 Stone = 10 Grain, 1 Wood = 4 Grain
 *
 * Symbols not listed (e.g. SPS, AURA) have no daily cap.
 */
export const DEFAULT_DONATION_DAILY_CAPS: Record<string, number> = {
  GRAIN: 40_000,
  WOOD: 10_000,
  STONE: 4_000,
  IRON: 1_000,
};

export interface DonationConfig {
  enabled: boolean;
  pct: number;
  daily_caps: Record<string, number>;
}

export const DEFAULT_DONATION_CONFIG: DonationConfig = {
  enabled: DEFAULT_DONATION_ENABLED,
  pct: DEFAULT_DONATION_PCT,
  daily_caps: DEFAULT_DONATION_DAILY_CAPS,
};

// === Make Harvestable strategy ===

export type MakeHarvestableStrategy = "pool" | "transfer" | "swap" | "buy_dec";

/**
 * `pool` is first by default: withdrawing liquidity that has matured past the
 * 30-day vesting lock costs nothing, while transfer/swap/buy all pay the 10%
 * trade-hub fee.
 */
export const DEFAULT_MAKE_HARVESTABLE_STRATEGIES: MakeHarvestableStrategy[] = [
  "pool",
  "transfer",
  "swap",
  "buy_dec",
];

export const ALL_MAKE_HARVESTABLE_STRATEGIES: MakeHarvestableStrategy[] = [
  "pool",
  "transfer",
  "swap",
  "buy_dec",
];

export const MAKE_HARVESTABLE_STRATEGY_LABELS: Record<
  MakeHarvestableStrategy,
  string
> = {
  pool: "Pool (withdraw unlocked liquidity — no 10% fee)",
  transfer: "Transfer (move resource from another region)",
  swap: "Swap (trade surplus resource for needed one)",
  buy_dec: "Buy with DEC",
};

// === Top Up Pools strategy ===
// Mirrors the make-harvestable model: an ordered list of enabled strategies.
// The first entry is the preferred strategy; later entries are used only as
// fallbacks. A strategy missing from the list is disabled and never used.

export type TopUpPoolStrategy =
  | "use_owned_dec"
  | "swap_resource"
  | "sell_resource"
  | "buy_resources";

/**
 * Safest-first ordering: spend nothing extra when the player already holds both
 * sides of the deposit, then generate the DEC side by selling, then buy the
 * missing resource as a last resort. Any order (or subset) is valid.
 */
export const DEFAULT_TOP_UP_POOL_STRATEGIES: TopUpPoolStrategy[] = [
  "use_owned_dec",
  "swap_resource",
  "sell_resource",
  "buy_resources",
];

export const ALL_TOP_UP_POOL_STRATEGIES: TopUpPoolStrategy[] = [
  "use_owned_dec",
  "swap_resource",
  "sell_resource",
  "buy_resources",
];

export const TOP_UP_POOL_STRATEGY_LABELS: Record<TopUpPoolStrategy, string> = {
  use_owned_dec: "Use owned resource + wallet DEC",
  swap_resource: "Swap surplus of another resource into this one",
  sell_resource: "Sell resource to generate the DEC side",
  buy_resources: "Buy the missing resource with DEC",
};

/** Safety margin added on top of the weekly external-need target. */
export const TOP_UP_POOL_SAFETY_MARGIN = 1.1;

/**
 * Weeks of a donor resource's own consumption held back from `swap_resource`.
 *
 * A swap must never turn one resource's skip into another's, so the donor keeps
 * its own top-up target ({@link TOP_UP_POOL_SAFETY_MARGIN} weeks, which this
 * action is about to deposit) plus the one week it burns before the next run.
 * Measured against GROSS consumption: what the donor burns is what it must keep,
 * regardless of how much of it the region grows back.
 */
export const SWAP_DONOR_RESERVE_WEEKS = TOP_UP_POOL_SAFETY_MARGIN + 1;

/**
 * Extra output the Top Up Pools funding swap aims for, above what the deposit
 * actually needs.
 *
 * The swap is quoted against pool reserves read at PLAN time, but only lands a
 * block or more later. Any trade in between moves the rate, so a swap sized to
 * deliver the target EXACTLY arrives a hair short and the deposit is rejected
 * by the engine ("not enough resource to pool"). The quote already compensates
 * for engine-tick rounding (see `clearingInput`); this covers rate movement.
 *
 * The payoff is asymmetric: too small and the whole resource is skipped for the
 * run, too large and the only cost is the two-hop fee.
 * Which stays in the region as resource and reduces next week's need anyway.
 *
 * So it is biased upward: 0.5%
 *
 * The same margin is the tolerance `buildDepositOps` allows before skipping a
 * resource, so the two stay in step: raise this and the swap buys more slack
 * AND the deposit tolerates more drift.
 */
export const SWAP_OUTPUT_HEADROOM = 0.005;

/** Recommended pool buffer, expressed in weeks of consumption. */
export const POOL_BUFFER_WEEKS = 5;

// === Post-Harvest strategy ===

export type PostHarvestStrategy =
  | "accumulate"
  | "sell_and_pool"
  | "custom_plan";
export const DEFAULT_POST_HARVEST_STRATEGY: PostHarvestStrategy = "accumulate";
export const DEFAULT_POST_HARVEST_EXCLUDED_RESOURCES: string[] = [];
export const DEFAULT_POST_HARVEST_SELL_PCT = 0;
export const DEFAULT_POST_HARVEST_POOL_PCT = 100;
export const POST_HARVEST_STRATEGY_LABELS: Record<PostHarvestStrategy, string> =
  {
    accumulate: "Accumulate (do nothing)",
    sell_and_pool: "Sell % & add % to pool",
    custom_plan: "Custom Plan",
  };

export interface PostHarvestActionSummary {
  type:
    | "sell_for_dec"
    | "add_to_pool"
    | "buy_resource"
    | "swap_resource"
    | "transfer"
    | "remove_from_pool";
  region_uid: string;
  /** Destination region for `transfer` rows. */
  to_region_uid?: string;
  /**
   * Resource the row is about. For `swap_resource` and `transfer` this is the
   * resource that was SPENT; the swap's output lives in `to_symbol`/`to_resource_amount`.
   */
  symbol: string;
  /**
   * How much of `symbol` moved. The DIRECTION is implied by `type` — spent for
   * `sell_for_dec`, `swap_resource` and `transfer`, received for `buy_resource`,
   * deposited for `add_to_pool`.
   */
  resource_amount: number;
  /** DEC that moved. For `swap_resource` this is the intermediate hop. */
  dec_amount: number;
  /** `swap_resource` and `transfer` only: the resource received. */
  to_symbol?: string;
  /** `swap_resource` and `transfer` only: how much of `to_symbol` the swap/transfer delivered. */
  to_resource_amount?: number;
}

// === Custom Plan ===

export type CustomPlanActionType =
  | "transfer"
  | "pool"
  | "buy"
  | "sell"
  | "swap"
  | "pool_withdraw";
export type CustomPlanAmountType = "pct" | "abs";

export const CUSTOM_PLAN_ACTION_LABELS: Record<CustomPlanActionType, string> = {
  transfer: "Transfer",
  pool: "Pool",
  buy: "Buy",
  sell: "Sell",
  swap: "Swap",
  pool_withdraw: "Pool Withdraw",
};

export const MAX_CUSTOM_PLANS_PER_PLAYER = 5;
export const MAX_CUSTOM_PLAN_NAME_LENGTH = 40;

/** A persisted plan row as loaded from the DB. */
export interface CustomPlanItem {
  id: string;
  sequence: number;
  action_type: CustomPlanActionType;
  from_region_uid: string | null;
  to_region_uid: string | null;
  from_resource: string | null;
  to_resource: string | null;
  amount_type: CustomPlanAmountType;
  amount: number;
}

/** A saved Custom Plan with its ordered items. */
export interface CustomPlan {
  id: string;
  player: string;
  name: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  items: CustomPlanItem[];
}

/** An unsaved/in-editor plan row (includes transient UI state). */
export interface CustomPlanRowDraft {
  /** Client-only UUID for React key; not persisted. */
  draftId: string;
  action_type: CustomPlanActionType | "";
  from_region_uid: string;
  to_region_uid: string;
  from_resource: string;
  to_resource: string;
  amount_type: CustomPlanAmountType;
  amount: string; // string so partial input is supported
}

/** Per-row validation result produced by validateCustomPlan. */
export interface CustomPlanRowValidation {
  valid: boolean;
  /** Absolute resolved amount (from pct or abs). */
  resolvedAmount: number;
  /** Estimated received amount (for transfer, swap) or DEC cost (for pool, buy). */
  estimatedValue: number;
  /** Balance BEFORE this row consumes input (already accounting for previous rows). */
  currentBalance: number;
  /** Balance AFTER this row input is applied. */
  inputBalance: number;
  /** Symbol used for current/input balance chips. */
  balanceSymbol: string;
  /** The input consumed by this row shown in absolute terms. */
  inputAmountAbsolute: number;
  /** Estimated primary output. */
  estimatedOutputSymbol: string;
  estimatedOutputAmount: number;
  /** Optional secondary output (used by pool withdrawals). */
  estimatedOutputSymbol2?: string;
  estimatedOutputAmount2?: number;
  error: string | null;
}

export type CustomPlanStatus =
  | "empty"
  | "incomplete"
  | "invalid"
  | "valid"
  | "executing";

/** Full validation result for a plan. */
export interface CustomPlanValidationResult {
  rows: CustomPlanRowValidation[];
  status: CustomPlanStatus;
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
  /**
   * Max plots to process per run. null = process all eligible plots at once.
   * Smaller batches allow re-evaluation of market conditions between runs
   * for potentially better matches; larger batches process more in one go.
   */
  rental_batch_size: number | null;
  /**
   * When true, the Renew Rentals flow skips cards that are rented but NOT
   * currently staked on a land plot (stake_plot = 0).
   */
  land_renters_only: boolean;
}

export const DEFAULT_RENTAL_CONFIG: RentalConfig = {
  strategy: DEFAULT_RENTAL_STRATEGY,
  max_total_dec: 0,
  max_dec_per_day_per_worker: 0,
  min_land_base_pp: 0,
  min_foil: 0,
  rental_batch_size: 10,
  land_renters_only: false,
};

// === Buy ("purchase") strategy ===
// Mirrors the rental config but for buying cards outright instead of renting.
// Fully separate from RentalConfig so buying and renting can be tuned
// independently.

export type BuyStrategy = "highest_pp_per_dec";
export const DEFAULT_BUY_STRATEGY: BuyStrategy = "highest_pp_per_dec";
export const BUY_STRATEGY_LABELS: Record<BuyStrategy, string> = {
  highest_pp_per_dec: "Highest base_pp per DEC",
};

/** Batch size is a plain integer 1..50 (no "unlimited"). */
export const BUY_BATCH_SIZE_MIN = 1;
export const BUY_BATCH_SIZE_MAX = 50;

export interface BuyConfig {
  strategy: BuyStrategy;
  /** Absolute DEC budget across all picks for the whole run. 0 = no limit. */
  max_total_dec: number;
  /** Max DEC for a single bought card. 0 = no limit. */
  max_dec_per_worker: number;
  /** Minimum land_base_pp per card. 0 = no minimum. */
  min_land_base_pp: number;
  /** Minimum foil rank (0=Regular). Cards below this are skipped. */
  min_foil: number;
  /** Max plots to process per run (1..50). */
  buy_batch_size: number;
}

export const DEFAULT_BUY_CONFIG: BuyConfig = {
  strategy: DEFAULT_BUY_STRATEGY,
  max_total_dec: 0,
  max_dec_per_worker: 0,
  min_land_base_pp: 0,
  min_foil: 0,
  buy_batch_size: 10,
};

// === Worker eligibility (computed from region data) ===
/**
 * A deed plus the staking-derived fields the rental/buy flow needs. Carries the
 * full DeedComplete so the shared `filterDeeds` and the standard filter UI
 * work directly on it — no parallel filter implementation needed.
 */
export interface WorkerEligiblePlot extends DeedComplete {
  worker_count: number;
  max_workers: number;
  empty_slots: number;
  is_powered: boolean;
  biome_modifiers: BiomeModifiers;
}

export interface WorkerEligibilityResult {
  eligible: WorkerEligiblePlot[];
  unpoweredSkipped: WorkerEligiblePlot[];
}

// === Worker plan (dry run output) ===
// Shared by the rental and buy flows — a "worker" is a card assigned to an
// empty worker slot, whether rented or bought. The cost is always captured as
// `total_dec`; the per-day rental fields are present only for rentals.

export interface WorkerPlanPick {
  /** Market listing id — the item id passed to sm_market_rent / sm_market_purchase. */
  market_id: string;
  card_uid: string;
  card_detail_id: number;
  card_name: string;
  edition: number;
  rarity: CardRarity;
  bcx: number;
  max_bcx: number;
  foil: number;
  gold: boolean;
  level: number;
  color: string;
  biome_modifier: number;
  land_base_pp: number;
  effective_pp: number;
  /** Total DEC for this pick (rental: per-day × days; buy: one-time price). */
  total_dec: number;
  /** effective_pp / total_dec. */
  pp_per_dec: number;
  seller: string;
  card_image_url: string;
  /** Rental-only: per-day rate. Absent for purchases. */
  buy_price_per_day?: number;
  /** Rental-only: number of rental days. Absent for purchases. */
  rental_days?: number;
  /** Rental-only: listing expiration date. Absent for purchases. */
  expiration_date?: string;
}

export interface WorkerPlanItem {
  plot: WorkerEligiblePlot;
  picks: WorkerPlanPick[];
  slots_filled: number;
  slots_skipped: number;
  plot_total_dec: number;
  skip_reason: string | null;
}

export interface WorkerPlanTotals {
  plots_total: number;
  plots_with_picks: number;
  slots_total: number;
  slots_filled: number;
  total_dec: number;
}

// === Buy plan (dry run output) ===
// Eligible plots are computed exactly like rentals (powered plots with empty
// worker slots) — the buy flow reuses WorkerEligiblePlot. Picks/items/totals
// are the shared WorkerPlan* shapes; for purchases the rental-only fields
// (buy_price_per_day, rental_days, expiration_date) are simply absent.
export interface BuyPlan {
  config: BuyConfig;
  items: WorkerPlanItem[];
  totals: WorkerPlanTotals;
  warnings: string[];
}

export interface RentalPlan {
  config: RentalConfig;
  items: WorkerPlanItem[];
  totals: WorkerPlanTotals;
  warnings: string[];
  rental_days: number | null;
  rental_days_source: string;
}

// === Config (DB — per player) ===

export interface LandManagerConfig {
  player: string;
  enabled_regions: number[];
  make_harvestable_strategies: MakeHarvestableStrategy[];
  donation: DonationConfig;
  post_harvest_strategy: PostHarvestStrategy;
  post_harvest_excluded_resources: string[];
  post_harvest_sell_pct: number;
  post_harvest_pool_pct: number;
  top_up_pool_strategies: TopUpPoolStrategy[];
  rental: RentalConfig;
  buy: BuyConfig;
}

export function createDefaultLandManagerConfig(
  username: string
): LandManagerConfig {
  return {
    player: username,
    enabled_regions: [],
    make_harvestable_strategies: DEFAULT_MAKE_HARVESTABLE_STRATEGIES,
    donation: DEFAULT_DONATION_CONFIG,
    post_harvest_strategy: DEFAULT_POST_HARVEST_STRATEGY,
    post_harvest_excluded_resources: [],
    post_harvest_sell_pct: DEFAULT_POST_HARVEST_SELL_PCT,
    post_harvest_pool_pct: DEFAULT_POST_HARVEST_POOL_PCT,
    top_up_pool_strategies: DEFAULT_TOP_UP_POOL_STRATEGIES,
    rental: DEFAULT_RENTAL_CONFIG,
    buy: DEFAULT_BUY_CONFIG,
  };
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
  tokens: { token: string; received: number }[];
  fragment_found: boolean;
  fragment_chance: number;
}

// === Today panel logs ===

/**
 * Everything the Today panel shows for the authenticated player, one entry per
 * land-manager flow. Null means "that flow did not run today".
 *
 * NOTE: `mythicHarvest.results_json` is written optimistically right after the
 * broadcast, so its `fragment_found` is always false and its token amounts are
 * the planned ones. The confirmed outcome (fragment type included) comes from
 * the transaction lookup, not from here.
 */
export interface TodayLogs {
  harvest: {
    runs: number;
    resources_json: Record<string, number>;
    donations_json: Record<string, number>;
    unpaid_donations_json: Record<string, number>;
    donation_error: string | null;
    harvest_transactions: string[];
    donation_transactions: string[];
  } | null;
  makeHarvestable: {
    runs: number;
    actions_json: ActionSummary[];
    transactions: string[];
  } | null;
  postHarvest: {
    runs: number;
    actions_json: PostHarvestActionSummary[];
    transactions: string[];
  } | null;
  mythicHarvest: {
    runs: number;
    results_json: MythicHarvestResult[];
    donations_json: Record<string, number>;
    unpaid_donations_json: Record<string, number>;
    donation_error: string | null;
    transactions: string[];
    donation_transactions: string[];
  } | null;
  worker: {
    runs: number;
    rented_count: number;
    bought_count: number;
    staked_count: number;
    rent_total_dec: number;
    buy_total_dec: number;
    buy_total_usd: number;
    rent_transactions: string[];
    purchase_transactions: string[];
    stake_transactions: string[];
  } | null;
  stakeDec: TodayDecStakeLog | null;
  unstakeDec: TodayDecStakeLog | null;
}

/** Shared shape of the stake- and unstake-DEC day logs. */
export interface TodayDecStakeLog {
  runs: number;
  succeeded_json: Record<string, number>;
  failed_json: Record<string, number>;
  total_succeeded: number;
  total_failed: number;
  error: string | null;
  transactions: string[];
}

// === Renew rentals ===

export interface RenewRentalItem {
  card_uid: string;
  market_id: string;
  card_detail_id: number;
  dec_per_day: number;
  renewal_days: number;
  total_dec: number;
  /** ISO date when the current rental expires. Null when rental_date is absent. */
  current_rental_end: string | null;
  stake_plot: number;
  stake_region: number | null;
  /** The card owner (not the authenticated player). */
  owner: string;
}

export interface RenewRentalPlan {
  items: RenewRentalItem[];
  /** Rented cards whose rental already extends past the current season end. */
  skipped_already_renewed: number;
  /** Rented cards that had no market_id and could not be renewed. */
  skipped_no_market_id: number;
  /** Rented cards that have a pending cancellation (cancel_tx set). */
  skipped_cancel_tx: number;
  /** Rented cards skipped because land_renters_only is true and they are not staked on a plot. */
  skipped_not_on_land: number;
  /** Whether the land_renters_only config option is active. */
  land_renters_only: boolean;
  total_dec: number;
  dec_balance: number;
  sufficient_balance: boolean;
  season_days_remaining: number;
  current_season_end: string;
  next_season_end: string | null;
}

// === Top Up Pools plan (dry run + execution share this shape) ===

/** One add_liquidity leg — a single region contributing to a resource target. */
export interface TopUpPoolAddition {
  region_uid: string;
  region_name: string;
  resource_amount: number;
  dec_amount: number;
}

/**
 * How much of the remaining target one strategy managed to cover, and why it
 * stopped there. Strategies run in configured order and each takes on as much of
 * what is left as it can, so several can contribute to one resource.
 */
export interface TopUpPoolStrategyAttempt {
  strategy: TopUpPoolStrategy;
  ok: boolean;
  /** Resource units this strategy contributed to the deposit (0 when it failed). */
  covered: number;
  reason: string;
}

/**
 * A trade that funds a deposit, broadcast in phase 1 before any add_liquidity.
 *
 * An ordered list rather than one field per kind: `swap_resource` alone emits
 * both a swap (the resource side) and, when wallet DEC falls short, a sale of
 * the same donor resource (the DEC side). `from_symbol` is carried explicitly
 * because that donor is not the resource being topped up.
 */
export type TopUpPoolFundingStep =
  | {
      kind: "sell";
      region_uid: string;
      region_name: string;
      /** Resource sold — the donor's symbol, not necessarily the plan's. */
      from_symbol: string;
      amount: number;
      dec_out: number;
    }
  | {
      kind: "buy";
      region_uid: string;
      region_name: string;
      dec_in: number;
      resource_out: number;
    }
  | {
      kind: "swap";
      region_uid: string;
      region_name: string;
      /** Surplus resource spent to obtain the plan's resource. */
      from_symbol: string;
      in_amount: number;
      /** DEC after hop 1 — the op's `out_amount_1`. */
      dec_out: number;
      /** Resource after hop 2 — the op's `out_amount_2`. */
      resource_out: number;
    };

export interface TopUpPoolResourcePlan {
  symbol: string;
  /** Gross units burned per 7 days across the planned regions. */
  weekly_consumption: number;
  /** Units that must come from outside the regions per 7 days (net of production). */
  weekly_external_need: number;
  /** Gross burn per hour, summed across regions. */
  consumed_per_hour: number;
  /** Natural production per hour, summed across regions. */
  produced_per_hour: number;
  /** Per-region max(0, consumed - produced) per hour, summed across regions. */
  external_need_per_hour: number;
  /** weekly_external_need × TOP_UP_POOL_SAFETY_MARGIN. */
  target: number;
  available_resource: number;
  dec_available: number;
  /** DEC required for the equal-value side of the full target. */
  dec_required: number;
  attempts: TopUpPoolStrategyAttempt[];
  /** Every strategy that contributed resource to this deposit, in run order. */
  contributing_strategies: TopUpPoolStrategy[];
  /** Trades that fund the deposit, in the order they must be broadcast. */
  funding: TopUpPoolFundingStep[];
  additions: TopUpPoolAddition[];
  total_resource: number;
  total_dec: number;
  status: "READY" | "SKIPPED";
  skip_reason: string | null;
}

export interface TopUpPoolPlan {
  resources: TopUpPoolResourcePlan[];
  /** Wallet DEC at planning time. */
  dec_balance: number;
  /** Regions with no reliable last-claim timestamp, so consumption is unknown. */
  consumption_warnings: string[];
  log: string[];
}

// === Action summary for make-harvestable log ===

export interface ActionSummary {
  type: "transfer" | "swap" | "buy_dec" | "pool";
  from_region: string;
  to_region: string;
  from_symbol: string;
  to_symbol: string;
  in_amount: number;
  out_amount: number;
}
