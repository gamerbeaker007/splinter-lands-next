import { SERVICE_FEE_RECIPIENT } from "@/types/landManager";

// Resources that are soulbound on Splinterlands and cannot be transferred
// between regions/players. Fees in these resources are skipped entirely.
export const NON_TRANSFERRABLE_FEE_RESOURCES = new Set(["RESEARCH", "AURA"]);

export function isFeeResourceTransferrable(symbol: string): boolean {
  return !NON_TRANSFERRABLE_FEE_RESOURCES.has(symbol);
}

export function generateNonce(length = 10): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

function customJsonOp(
  username: string,
  payload: Record<string, unknown>
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [],
      required_posting_auths: [username],
      id: "sm_land_operation",
      json: JSON.stringify({
        ...payload,
        app: "splinterlands/0.7.177",
        n: generateNonce(),
      }),
    },
  ];
}

export function buildHarvestOp(
  username: string,
  regionUid: string
): [string, object] {
  return customJsonOp(username, {
    op: "harvest_all",
    region_uid: regionUid,
    deed_uids: [],
    auto_buy_grain: false,
    resource_symbol: "ALL",
  });
}

/**
 * The cross-region `swap_tokens` op covers:
 *   - Transfer: same fromSymbol/toSymbol, different regions, optionally
 *               re-routed to another player (fee payments).
 *   - Swap:     different fromSymbol/toSymbol (resource → resource via DEC).
 *
 * Default max_slippage is tight (2.5) because for normal swaps our
 * out_amount math matches the engine's. The fee transfer overrides it to
 * 20 because the engine validates against the PER-HUB pool, not the
 * GLOBAL aggregate we compute from, and a divergent per-hub pool can
 * legitimately reject a fair trade at 2.5.
 */
const DEFAULT_SWAP_MAX_SLIPPAGE = 2.5;
const FEE_TRANSFER_MAX_SLIPPAGE = 20;

export interface SwapTokensOpInput {
  username: string;
  fromRegionUid: string;
  toRegionUid: string;
  fromSymbol: string;
  toSymbol: string;
  inAmount: number;
  outAmount1: number;
  outAmount2: number;
  /** When set, the resulting tokens land in this player's account (fee payments). Omit for self-transfers. */
  toPlayer?: string;
  /** Add `notify_transport: 1` (used by fee payments so the recipient sees them). */
  notifyTransport?: boolean;
  /** Override engine slippage tolerance (percent). Defaults to DEFAULT_SWAP_MAX_SLIPPAGE. */
  maxSlippage?: number;
}

export function buildSwapTokensOp(input: SwapTokensOpInput): [string, object] {
  const payload: Record<string, unknown> = {
    op: "swap_tokens",
    max_slippage: input.maxSlippage ?? DEFAULT_SWAP_MAX_SLIPPAGE,
    from_region_uid: input.fromRegionUid,
    to_region_uid: input.toRegionUid,
    in_amount: input.inAmount,
    out_amount_1: input.outAmount1,
    out_amount_2: input.outAmount2,
    from_symbol: input.fromSymbol,
    to_symbol: input.toSymbol,
  };
  if (input.toPlayer) payload.to_player = input.toPlayer;
  if (input.notifyTransport) payload.notify_transport = 1;
  return customJsonOp(input.username, payload);
}

/**
 * Same-symbol cross-region transfer aimed at the service-fee recipient.
 * Uses a relaxed slippage tolerance because per-hub pool prices can
 * legitimately diverge from the global aggregate for shallow pools.
 */
export function buildFeeTransferOp(
  username: string,
  fromRegionUid: string,
  toRegionUid: string,
  symbol: string,
  inAmount: number,
  outAmount1: number,
  outAmount2: number
): [string, object] {
  return buildSwapTokensOp({
    username,
    fromRegionUid,
    toRegionUid,
    fromSymbol: symbol,
    toSymbol: symbol,
    inAmount,
    outAmount1,
    outAmount2,
    toPlayer: SERVICE_FEE_RECIPIENT,
    notifyTransport: true,
    maxSlippage: FEE_TRANSFER_MAX_SLIPPAGE,
  });
}

export function buildAddLiquidityOp(
  username: string,
  regionUid: string,
  resourceSymbol: string,
  resourceAmount: number,
  decAmount: number
): [string, object] {
  return customJsonOp(username, {
    op: "add_liquidity",
    region_uid: regionUid,
    resource_amount: resourceAmount,
    dec_amount: decAmount,
    shares_out: 0,
    resource_symbol: resourceSymbol,
  });
}

export function buildTaxCollectionOp(
  username: string,
  regionUid: string,
  deedUid: string
): [string, object] {
  return customJsonOp(username, {
    op: "tax_collection",
    region_uid: regionUid,
    deed_uids: [deedUid],
    auto_buy_grain: false,
    resource_symbol: "",
  });
}

/**
 * Send the SPS service-fee to Splinterlands via the standard sm_token_transfer
 * op. Routed through `sl-hive` with the recipient username in the memo.
 *
 * Unlike sm_land_operation, this op requires the user's ACTIVE key (not
 * posting), so it must be broadcast in its own batch with the right method.
 */
export function buildSpsFeeTransferOp(
  username: string,
  qty: number
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [username],
      required_posting_auths: [],
      id: "sm_token_transfer",
      json: JSON.stringify({
        token: "SPS",
        to: SERVICE_FEE_RECIPIENT,
        qty,
        memo: "service fee for splinter-lands tool",
        app: "splinterlands/0.7.177",
        n: generateNonce(),
      }),
    },
  ];
}

/** Buy a resource by spending DEC from the trade hub in a region. */
export function buildBuyWithDecOp(
  username: string,
  regionUid: string,
  decAmount: number,
  sharesOut: number,
  resourceSymbol: string
): [string, object] {
  return customJsonOp(username, {
    op: "swap_tokens",
    region_uid: regionUid,
    dec_amount: decAmount,
    shares_out: sharesOut,
    max_slippage: 2.5,
    resource_symbol: resourceSymbol,
  });
}
