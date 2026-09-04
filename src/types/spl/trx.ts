// ── Raw API envelope ──────────────────────────────────────────────────────────

export interface SplTrxInfo {
  id: string;
  /** Envelope type: "land_operation" for land ops; otherwise the op itself (e.g. "market_cancel_rental"). */
  type: string;
  player: string;
  /** JSON string of the op INPUT — for land_operation it contains `{ op, ... }`. */
  data: string;
  /**
   * JSON string of the op OUTPUT. Two shapes depending on `type`:
   *  - land_operation: `{ success, result: { success, error, data, ... } }` (the
   *    op's payload is the inner `result.data`).
   *  - everything else: the result envelope directly.
   */
  result: string;
  success: boolean;
  error?: string | null;
  error_code?: string;
  created_date: string;
}

export interface SplTrxLookupResponse {
  trx_info: SplTrxInfo;
}

// ── harvest_all ───────────────────────────────────────────────────────────────

/**
 * Card awarded by the Labor's Luck ability during a harvest. Only present on
 * deeds that have Labor's Luck AND won the roll — absent otherwise.
 */
export interface LaborsLuckTreasure {
  /** Card uid, e.g. "G19-866-2632A608C0" — encodes foil + edition + card id. */
  uid: string;
  card_detail_id: number;
  xp: number;
  gold: boolean;
  tier: number;
  /** Numeric foil id (0=regular, 1=gold, 2=gold arcane, 3=black, 4=black arcane). */
  foil: number;
  mint: number | null;
}

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
  /** Only set when the deed has Labor's Luck and the roll succeeded. */
  labors_luck_treasure?: LaborsLuckTreasure | null;
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
  fragment_roll: number;
  /** Fragment code, e.g. "TOTEMFC" (common). Null when nothing was found. */
  fragment_type: string | null;
}

// ── add_liquidity ─────────────────────────────────────────────────────────────

export interface AddLiquidityTrxData {
  resource: string;
  resource_amount: number;
  dec_amount: number;
  region_uid: string;
  region_name: string;
}

// ── remove_liquidity ──────────────────────────────────────────────────────────

/**
 * Result of withdrawing from a resource pool. `resource_amount`/`dec_amount`
 * are what the engine actually paid out for the requested share fraction — the
 * input op carries neither, so these are the only source of truth.
 */
export interface RemoveLiquidityTrxData {
  resource: string;
  resource_amount: number;
  dec_amount: number;
  region_uid: string;
  region_name: string;
  dec_fee: number;
  resource_fee: number;
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

export interface MarketItem {
  market_item_id: number;
  rental_tx: string;
  rental_date: Date;
  renter: string;
  status: number;
  market_account: string;
  rental_days: number;
  next_rental_payment: Date;
  payment_currency: string;
  payment_amount: number;
  escrow_currency: string;
  escrow_amount: number;
  paid_amount: number;
  cancel_tx: string;
  cancel_player: string;
  cancel_date: Date;
  completed_date: Date | null;
  dec_price: string | null;
  id: string;
  renewal_tx: string | null;
  renewal_date: Date | null;
  rental_season_id: number;
}

export interface MarketCancelRentalTrxData {
  market_items: MarketItem[];
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

// ── token_transfer ────────────────────────────────────────────────────────────
// Result of sm_token_transfer (DEC/SPS sent to another player). The result IS
// the outer envelope: `{ success, from, to, amount, token, trx_id, created_date }`.

export interface TokenTransferTrxData {
  from: string;
  to: string;
  /** "DEC", "SPS", … — whatever the engine confirms back, not what was asked for. */
  token: string;
  amount: number;
  /** When the engine settled the transfer; falls back to the envelope date. */
  date: Date;
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
// Each member is one parsed transaction outcome.
//   `op`     — WHAT happened. NOTE this is NOT trx_info.type: for land_operation
//              transactions it's the inner `data.op` (e.g. "swap_tokens"); for
//              everything else it equals trx_info.type (e.g. "market_cancel_rental").
//              The "land_operation" envelope itself never appears here.
//   `result` — the parsed OUTPUT payload. (The API's `trx_info.data` is the INPUT
//              and is not carried here — don't confuse the two.)

export type SplTrxResult =
  | { op: "harvest_all"; result: HarvestAllTrxData }
  | { op: "swap_tokens"; result: SwapTokensTrxData }
  | { op: "tax_collection"; result: TaxCollectionTrxData }
  | { op: "add_liquidity"; result: AddLiquidityTrxData }
  | { op: "remove_liquidity"; result: RemoveLiquidityTrxData }
  | { op: "market_rent"; result: MarketRentTrxData }
  | { op: "market_renew_rental"; result: MarketRentTrxData }
  | { op: "market_cancel_rental"; result: MarketCancelRentalTrxData }
  | { op: "market_purchase"; result: MarketPurchaseTrxData }
  | { op: "stake_change"; result: StakeChangeTrxData }
  | { op: "dec_powerup_region"; result: DecPowerRegionTrxData }
  | { op: "dec_powerdown_region"; result: DecPowerRegionTrxData }
  | { op: "worksite_construction"; result: WorksiteConstructionTrxData }
  | { op: "cancel_construction"; result: CancelConstructionTrxData }
  | { op: "update_worksite"; result: UpdateWorksiteTrxData }
  | { op: "set_authority"; result: SetAuthorityTrxData }
  | { op: "token_transfer"; result: TokenTransferTrxData };

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
