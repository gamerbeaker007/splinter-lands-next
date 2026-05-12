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

// ── Discriminated union ───────────────────────────────────────────────────────
// Keyed by data.op, not trx_info.type (which is always "land_operation").
// Add a new member + case in parseLandOpResult when a new op needs to be parsed.

export type SplTrxResult =
  | { type: "harvest_all"; data: HarvestAllTrxData }
  | { type: "swap_tokens"; data: SwapTokensTrxData }
  | { type: "tax_collection"; data: TaxCollectionTrxData }
  | { type: "add_liquidity"; data: AddLiquidityTrxData };

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
