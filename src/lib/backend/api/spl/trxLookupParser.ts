import type {
  AddLiquidityTrxData,
  CancelConstructionTrxData,
  DecPowerRegionTrxData,
  HarvestAllTrxData,
  MarketCancelRentalTrxData,
  MarketItem,
  MarketPurchaseTrxData,
  MarketRentTrxData,
  SplTrxInfo,
  SplTrxResult,
  StakeChangeTrxData,
  SwapTokensTrxData,
  TaxCollectionTrxData,
  TrxLookupOutcome,
  UpdateWorksiteTrxData,
} from "@/types/spl/trx";

// Parses a transaction-lookup envelope (trx_info) into a typed TrxLookupOutcome.
//
// The SPL API serves two result layouts (see SplTrxInfo.result):
//   • land_operation ops  → payload nested at outer.result.data   → use `nested(...)`
//   • all other trx types → payload IS the outer envelope         → use `direct(...)`
//
// To support a new transaction: add its `*TrxData` interface + union member in
// types/spl/trx.ts, write a `parse*` field parser below, and add ONE line to the
// PARSERS registry. Ops with non-standard success checks get a custom entry.

type Raw = Record<string, unknown>;

/** Result payload type for a given op K, pulled from the SplTrxResult union. */
type ResultFor<K extends SplTrxResult["op"]> = Extract<
  SplTrxResult,
  { op: K }
>["result"];

// ── field parsers: Raw → typed result payload ─────────────────────────────────

function parseHarvestAll(d: Raw): HarvestAllTrxData {
  return {
    success: d.success as boolean,
    message: (d.message as string) ?? "",
    results: (d.results as HarvestAllTrxData["results"]) ?? [],
    deeds: (d.deeds as HarvestAllTrxData["deeds"]) ?? [],
    num_worksite_transitions: (d.num_worksite_transitions as number) ?? 0,
  };
}

function parseSwapTokens(d: Raw): SwapTokensTrxData {
  return {
    resource: (d.resource as string) ?? "",
    resource_amount: (d.resource_amount as number) ?? 0,
    dec_amount: (d.dec_amount as number) ?? 0,
    region_uid: (d.region_uid as string) ?? "",
    region_name: (d.region_name as string) ?? "",
    to_player: (d.to_player as string) ?? "",
  };
}

function parseTaxCollection(d: Raw): TaxCollectionTrxData {
  return {
    deed_uid: (d.deed_uid as string) ?? "",
    kingdom_type: (d.kingdom_type as string) ?? "",
    elapsed_hours: (d.elapsed_hours as number) ?? 0,
    tokens: ((d.tokens as { tokens?: unknown[] })?.tokens ??
      []) as TaxCollectionTrxData["tokens"],
    fragment_found: (d.fragment_found as boolean) ?? false,
    fragment_chance: (d.fragment_chance as number) ?? 0,
  };
}

function parseAddLiquidity(d: Raw): AddLiquidityTrxData {
  return {
    resource: (d.resource as string) ?? "",
    resource_amount: (d.resource_amount as number) ?? 0,
    dec_amount: (d.dec_amount as number) ?? 0,
    region_uid: (d.region_uid as string) ?? "",
    region_name: (d.region_name as string) ?? "",
  };
}

function parseMarketRent(d: Raw): MarketRentTrxData {
  return {
    success: (d.success as boolean) ?? false,
    renter: (d.renter as string) ?? "",
    num_cards: (d.num_cards as number) ?? 0,
    total_price: (d.total_price as number) ?? 0,
    total_fees_dec: (d.total_fees_dec as number) ?? 0,
    total_market_fees_dec: (d.total_market_fees_dec as number) ?? 0,
    total_burn_fees_dec: (d.total_burn_fees_dec as number) ?? 0,
    total_referral_cut: (d.total_referral_cut as number) ?? 0,
    by_seller: (d.by_seller as MarketRentTrxData["by_seller"]) ?? [],
  };
}

function parseMarketCancelRental(d: Raw): MarketCancelRentalTrxData {
  return {
    market_items: (d.market_items as MarketItem[]) ?? [],
  };
}

function parseMarketPurchase(d: Raw): MarketPurchaseTrxData {
  return {
    success: (d.success as boolean) ?? false,
    purchaser: (d.purchaser as string) ?? "",
    num_cards: (d.num_cards as number) ?? 0,
    total_usd: (d.total_usd as number) ?? 0,
    total_dec: (d.total_dec as number) ?? 0,
    total_fees_dec: (d.total_fees_dec as number) ?? 0,
    total_market_fees_dec: (d.total_market_fees_dec as number) ?? 0,
    total_burn_fees_dec: (d.total_burn_fees_dec as number) ?? 0,
    total_referral_cut: (d.total_referral_cut as number) ?? 0,
    by_seller: (d.by_seller as MarketPurchaseTrxData["by_seller"]) ?? [],
  };
}

function parseDecPowerRegion(d: Raw): DecPowerRegionTrxData {
  const harvest = (d.harvestResults as Raw | undefined) ?? {};
  const harvestData = (harvest.data as Raw | undefined) ?? {};
  return {
    pre_op_efficiency: (d.pre_op_efficiency as number) ?? 0,
    post_op_efficiency: (d.post_op_efficiency as number) ?? 0,
    harvest_succeeded: (harvest.success as boolean) ?? false,
    harvest_error: (harvest.error as string) ?? "",
    harvest_message: (harvestData.message as string) ?? "",
    harvest_deed_count: Array.isArray(harvestData.results)
      ? (harvestData.results as unknown[]).length
      : 0,
    harvest_results:
      (harvestData.results as DecPowerRegionTrxData["harvest_results"]) ?? [],
  };
}

function parseStakeChange(d: Raw): StakeChangeTrxData {
  return {
    result_code: (d.result_code as number) ?? -1,
    error_message: (d.error_message as string) ?? "",
    harvest_data: (d.harvest_data as unknown[]) ?? [],
    ashes_used: (d.ashes_used as number) ?? 0,
    ashes_starting_balance: (d.ashes_starting_balance as number) ?? 0,
  };
}

function parseCancelConstruction(d: Raw): CancelConstructionTrxData {
  return {
    deed_uid: (d.deed_uid as string) ?? "",
    project_id: (d.project_id as number) ?? 0,
  };
}

function parseUpdateWorksite(d: Raw): UpdateWorksiteTrxData {
  return {
    deed_uid: (d.deed_uid as string) ?? "",
    region_number: (d.region_number as number) ?? 0,
    plot_number: (d.plot_number as number) ?? 0,
    dec_spent: (d.dec_spent as number) ?? 0,
    result_message: (d.result_message as string) ?? "",
  };
}

// ── envelope combinators: encode the two result layouts once ──────────────────

/** land_operation ops: failure + payload live in the nested `outer.result`. */
function nested<K extends SplTrxResult["op"]>(
  op: K,
  parse: (d: Raw) => ResultFor<K>,
  fallbackError: string
): (outer: Raw) => TrxLookupOutcome {
  return (outer) => {
    const inner = outer?.result as Raw | undefined;
    if (inner?.success === false) {
      const error =
        (inner.error as string) ?? (outer?.error as string) ?? fallbackError;
      return { status: "failed", error };
    }
    const d = inner?.data as Raw | undefined;
    if (!d) return { status: "pending" };
    return {
      status: "success",
      result: { op, result: parse(d) } as SplTrxResult,
    };
  };
}

/** Top-level ops: the result IS the outer envelope. */
function direct<K extends SplTrxResult["op"]>(
  op: K,
  parse: (outer: Raw) => ResultFor<K>,
  fallbackError: string
): (outer: Raw) => TrxLookupOutcome {
  return (outer) => {
    if (outer?.success === false) {
      return {
        status: "failed",
        error: (outer.error as string) ?? fallbackError,
      };
    }
    return {
      status: "success",
      result: { op, result: parse(outer) } as SplTrxResult,
    };
  };
}

// ── custom entries: ops whose success check isn't the standard `success` flag ──

function parseStakeChangeOutcome(outer: Raw): TrxLookupOutcome {
  const code = outer?.result_code;
  if (typeof code === "number" && code !== 0) {
    return {
      status: "failed",
      error: (outer.error_message as string) ?? "Stake change failed",
    };
  }
  return {
    status: "success",
    result: { op: "stake_change", result: parseStakeChange(outer) },
  };
}

function parseSetAuthorityOutcome(outer: Raw): TrxLookupOutcome {
  if (outer?.success === false) {
    return {
      status: "failed",
      error: (outer.error as string) ?? "set_authority failed",
    };
  }
  const auth = outer?.authority as
    | { rental?: string[]; purchase?: string[]; delegation?: string[] }
    | undefined;
  if (!auth) return { status: "pending" };
  return {
    status: "success",
    result: {
      op: "set_authority",
      result: {
        rental: Array.isArray(auth.rental) ? auth.rental : [],
        purchase: Array.isArray(auth.purchase) ? auth.purchase : [],
        delegation: Array.isArray(auth.delegation) ? auth.delegation : [],
      },
    },
  };
}

// ── registry: op string → outcome parser ──────────────────────────────────────

const WORKSITE_CONSTRUCTION_OPS = [
  "worksite_grain_construction",
  "worksite_wood_construction",
  "worksite_iron_construction",
  "worksite_stone_construction",
  "worksite_research_construction",
  "worksite_aura_construction",
  "worksite_sps_construction",
] as const;

const PARSERS: Record<string, (outer: Raw) => TrxLookupOutcome> = {
  // land_operation ops (nested)
  harvest_all: nested("harvest_all", parseHarvestAll, "Harvest failed"),
  swap_tokens: nested("swap_tokens", parseSwapTokens, "Swap failed"),
  tax_collection: nested(
    "tax_collection",
    parseTaxCollection,
    "Tax collection failed"
  ),
  add_liquidity: nested(
    "add_liquidity",
    parseAddLiquidity,
    "Add liquidity failed"
  ),
  dec_powerup_region: nested(
    "dec_powerup_region",
    parseDecPowerRegion,
    "DEC power-up failed"
  ),
  dec_powerdown_region: nested(
    "dec_powerdown_region",
    parseDecPowerRegion,
    "DEC power-down failed"
  ),
  cancel_construction: nested(
    "cancel_construction",
    parseCancelConstruction,
    "Cancel construction failed"
  ),
  update_worksite: nested(
    "update_worksite",
    parseUpdateWorksite,
    "Feed workers failed"
  ),
  // top-level ops (direct)
  market_rent: direct(
    "market_rent",
    parseMarketRent,
    "Rent transaction failed"
  ),
  market_renew_rental: direct(
    "market_renew_rental",
    parseMarketRent,
    "Renew rental transaction failed"
  ),
  market_cancel_rental: direct(
    "market_cancel_rental",
    parseMarketCancelRental,
    "Cancel rental transaction failed"
  ),
  market_purchase: direct(
    "market_purchase",
    parseMarketPurchase,
    "Purchase transaction failed"
  ),
  // custom success checks
  stake_change: parseStakeChangeOutcome,
  set_authority: parseSetAuthorityOutcome,
};

// All worksite construction ops share one parser, injecting their project_type.
for (const op of WORKSITE_CONSTRUCTION_OPS) {
  PARSERS[op] = nested(
    "worksite_construction",
    (d) => ({
      project_type: op,
      deed_uid: (d.deed_uid as string) ?? "",
      project_id: (d.project_id as number) ?? 0,
    }),
    "Construction failed"
  );
}

/**
 * Parses a raw `trx_info` envelope into a TrxLookupOutcome:
 *  - pending  — not on-chain yet, malformed, or an unknown op (keep polling)
 *  - failed   — on-chain but rejected (stop polling)
 *  - success  — confirmed and parsed into the typed SplTrxResult
 */
export function parseTrxInfo(
  trxInfo: SplTrxInfo | null | undefined
): TrxLookupOutcome {
  // Not yet on-chain — trx_info absent.
  if (!trxInfo) return { status: "pending" };

  // On-chain but rejected by the game engine (envelope-level).
  if (!trxInfo.success) {
    return {
      status: "failed",
      error: trxInfo.error ?? trxInfo.error_code ?? "Transaction failed",
    };
  }

  if (!trxInfo.result) return { status: "pending" };

  let outer: Raw;
  let input: Raw;
  try {
    outer = JSON.parse(trxInfo.result) as Raw;
    input = JSON.parse(trxInfo.data) as Raw;
  } catch {
    return { status: "pending" };
  }

  // land_operation carries the real op in data.op; other trx types are keyed by trx_info.type.
  const op = (input.op as string | undefined) ?? trxInfo.type;
  const parser = PARSERS[op];
  if (!parser) return { status: "pending" };
  return parser(outer);
}
