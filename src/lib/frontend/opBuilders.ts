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

export function buildFeeTransferOp(
  username: string,
  fromRegionUid: string,
  toRegionUid: string,
  symbol: string,
  inAmount: number,
  outAmount1: number,
  outAmount2: number
): [string, object] {
  return customJsonOp(username, {
    op: "swap_tokens",
    max_slippage: 2.5,
    from_region_uid: fromRegionUid,
    to_region_uid: toRegionUid,
    in_amount: inAmount,
    out_amount_1: outAmount1,
    out_amount_2: outAmount2,
    from_symbol: symbol,
    to_symbol: symbol,
    to_player: "beaker007",
    notify_transport: 1,
  });
}

/**
 * Generic swap_tokens op — covers both:
 *   - Transfer: same fromSymbol/toSymbol, different regions
 *   - Swap:     different fromSymbol/toSymbol, any regions
 */
export function buildSwapTokensOp(
  username: string,
  fromRegionUid: string,
  toRegionUid: string,
  fromSymbol: string,
  toSymbol: string,
  inAmount: number,
  outAmount1: number,
  outAmount2: number
): [string, object] {
  return customJsonOp(username, {
    op: "swap_tokens",
    max_slippage: 2.5,
    from_region_uid: fromRegionUid,
    to_region_uid: toRegionUid,
    in_amount: inAmount,
    out_amount_1: outAmount1,
    out_amount_2: outAmount2,
    from_symbol: fromSymbol,
    to_symbol: toSymbol,
  });
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
