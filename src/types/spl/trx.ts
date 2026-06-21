// ── Raw API envelope ──────────────────────────────────────────────────────────

export interface SplTrxInfo {
  id: string;
  type: string; // always "land_operation" for land ops
  player: string;
  data: string; // JSON string — contains { op, ... }
  result: string; // double-JSON-encoded result envelope
  success: boolean;
  created_date: string;
}

export interface SplTrxLookupResponse {
  trx_info: SplTrxInfo;
}

// ── harvest_all ───────────────────────────────────────────────────────────────

export interface HarvestAllDeedResult {
  id: number;
  project_number: number;
  deed_uid: string;
  plot_id: number;
  tract_number: number;
  region_number: number;
  land_work_type_id: number;
  resource_amount: number;
  received_amount: number;
  tax_amount: number;
  resource_symbol: string;
  result_message: string;
  grain_eaten: number;
  grain_rewards_eaten: number;
  work_efficiency: number;
  dec_spent: number;
  is_worksite_transition: boolean;
  new_worksite_type: string;
  inputs_consumed: unknown[];
  fragment_chance: number;
  fragment_roll: number;
  elapsed_hours: number;
}

export interface HarvestAllDeedInfo {
  deed_uid: string;
  total_base_pp_after_cap: number;
  is_runi_staked: boolean;
  has_labors_luck: boolean;
  token_symbol: string;
}

export interface HarvestAllTrxData {
  success: boolean;
  message: string;
  results: HarvestAllDeedResult[];
  deeds: HarvestAllDeedInfo[];
  num_worksite_transitions: number;
}

// ── swap_tokens ───────────────────────────────────────────────────────────────
// Covers buy-with-DEC, resource-to-DEC sell, same-symbol transfer, cross-symbol swap.

/** Parsed from trx_info.data (the original broadcast op input). */
export interface SwapTokensOpInput {
  region_uid: string;
  resource_amount: number; // the amount the player actually sent
  resource_symbol: string;
}

/** Parsed from trx_info.result (what the engine confirms back). resource_amount is always 0 for sells. */
export interface SwapTokensTrxData {
  resource: string;
  resource_amount: number;
  dec_amount: number;
  region_uid: string;
  region_name: string;
  to_player: string;
}

// ── tax_collection ────────────────────────────────────────────────────────────

export interface TaxCollectionTokenResult {
  token: string;
  received: string;
}

export interface TaxCollectionTrxData {
  deed_uid: string;
  kingdom_type: string;
  elapsed_hours: number;
  tokens: TaxCollectionTokenResult[];
  fragment_found: boolean;
  fragment_chance: number;
}

// ── add_liquidity ─────────────────────────────────────────────────────────────

export interface AddLiquidityTrxData {
  resource: string;
  resource_amount: number;
  dec_amount: number;
  region_uid: string;
  region_name: string;
}

// ── market_rent ───────────────────────────────────────────────────────────────

export interface MarketRentSellerResult {
  seller: string;
  items: string[];
  total_dec: number;
  total_fees: number;
  market_fees: number;
  burn_fees: number;
  referral_cut: number;
}

export interface MarketRentTrxData {
  success: boolean;
  renter: string;
  num_cards: number;
  total_price: number;
  total_fees_dec: number;
  total_market_fees_dec: number;
  total_burn_fees_dec: number;
  total_referral_cut: number;
  by_seller: MarketRentSellerResult[];
}

// ── market_purchase ─────────────────────────────────────────────────────────

export interface MarketPurchaseSellerResult {
  seller: string;
  items: string[];
  total_usd: number;
  total_dec: number;
  total_fees: number;
  market_fees: number;
  burn_fees: number;
  referral_cut: number;
}

export interface MarketPurchaseTrxData {
  success: boolean;
  purchaser: string;
  num_cards: number;
  total_usd: number;
  total_dec: number;
  total_fees_dec: number;
  total_market_fees_dec: number;
  total_burn_fees_dec: number;
  total_referral_cut: number;
  by_seller: MarketPurchaseSellerResult[];
}

// ── dec_powerup_region / dec_powerdown_region ─────────────────────────────────
// Result of staking (powerup) or unstaking (powerdown) DEC in a region. Both
// trigger an auto-harvest as a side effect and return the identical envelope —
// we surface the key bits (efficiency change + the inner harvest outcome) so
// callers can verify the op landed and report what happened during the implicit
// harvest. The two ops share this data shape.

export interface DecPowerRegionTrxData {
  pre_op_efficiency: number;
  post_op_efficiency: number;
  /** True when the auto-harvest sub-step ran cleanly. */
  harvest_succeeded: boolean;
  /** Inner harvest error, empty string when none. */
  harvest_error: string;
  /** Human-readable summary from the inner harvest (e.g. "1 deeds were harvested"). */
  harvest_message: string;
  /** Number of deeds harvested as part of the auto-harvest. */
  harvest_deed_count: number;
  /** Per-deed harvest outcomes — same shape as harvest_all results. */
  harvest_results: HarvestAllDeedResult[];
}

// ── worksite_*_construction ──────────────────────────────────────────────────

export interface WorksiteConstructionTrxData {
  /** e.g. "worksite_wood_construction" */
  project_type: string;
  deed_uid: string;
  project_id: number;
}

// ── cancel_construction ───────────────────────────────────────────────────────

export interface CancelConstructionTrxData {
  deed_uid: string;
  project_id: number;
}

// ── update_worksite (feed workers / activate a ready worksite) ─────────────────

export interface UpdateWorksiteTrxData {
  deed_uid: string;
  region_number: number;
  plot_number: number;
  dec_spent: number;
  result_message: string;
}

// ── set_authority ────────────────────────────────────────────────────────────
// Result of sm_set_authority (grant/revoke rental/purchase/delegation).
// The `result` envelope is `{ success, authority: { rental, purchase, delegation } }`.

export interface SetAuthorityTrxData {
  rental: string[];
  purchase: string[];
  delegation: string[];
}

// ── stake_change ──────────────────────────────────────────────────────────────

export interface StakeChangeTrxData {
  result_code: number;
  error_message: string;
  harvest_data: unknown[];
  ashes_used: number;
  ashes_starting_balance: number;
}

// ── Discriminated union ───────────────────────────────────────────────────────
// For sm_land_operation ops, keyed by data.op. For sm_market_rent /
// sm_stake_change, keyed by trx_info.type (the input data has no `op` field).

export type SplTrxResult =
  | { type: "harvest_all"; data: HarvestAllTrxData }
  | { type: "swap_tokens"; input: SwapTokensOpInput; data: SwapTokensTrxData }
  | { type: "tax_collection"; data: TaxCollectionTrxData }
  | { type: "add_liquidity"; data: AddLiquidityTrxData }
  | { type: "market_rent"; data: MarketRentTrxData }
  | { type: "market_renew_rental"; data: MarketRentTrxData }
  | { type: "market_purchase"; data: MarketPurchaseTrxData }
  | { type: "stake_change"; data: StakeChangeTrxData }
  | { type: "dec_powerup_region"; data: DecPowerRegionTrxData }
  | { type: "dec_powerdown_region"; data: DecPowerRegionTrxData }
  | { type: "worksite_construction"; data: WorksiteConstructionTrxData }
  | { type: "cancel_construction"; data: CancelConstructionTrxData }
  | { type: "update_worksite"; data: UpdateWorksiteTrxData }
  | { type: "set_authority"; data: SetAuthorityTrxData };

/**
 * Outcome of a single transaction lookup.
 * - `{ status: "pending" }` — not on-chain yet, keep polling
 * - `{ status: "failed"; error: string }` — on-chain but rejected; stop polling
 * - `{ status: "success"; result: SplTrxResult }` — confirmed and parsed
 */
export type TrxLookupOutcome =
  | { status: "pending" }
  | { status: "failed"; error: string }
  | { status: "success"; result: SplTrxResult };
