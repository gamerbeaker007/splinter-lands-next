// Resources that are soulbound on Splinterlands and cannot be transferred
// between regions/players. Donations in these resources are skipped entirely.

export const NON_TRANSFERABLE_DONATION_RESOURCES = new Set([
  "RESEARCH",
  "AURA",
]);

export function isDonationResourceTransferable(symbol: string): boolean {
  return !NON_TRANSFERABLE_DONATION_RESOURCES.has(symbol);
}

const APP = `${process.env.NEXT_PUBLIC_APP_NAME ?? "splinter-lands"}/${process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}`;
const MARKET = "spl-stats.com";

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
        app: APP,
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
const DONATION_TRANSFER_MAX_SLIPPAGE = 50;

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
export function buildDonationTransferOp(
  username: string,
  fromRegionUid: string,
  toPlayer: string,
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
    toPlayer,
    notifyTransport: true,
    maxSlippage: DONATION_TRANSFER_MAX_SLIPPAGE,
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

/** Sell a resource into the trade hub in a region, receiving DEC ("on hop" sell direction). */
export function buildSellResourceForDecOp(
  username: string,
  regionUid: string,
  resourceAmount: number,
  sharesOut: number,
  resourceSymbol: string,
  maxSlippage: number = 2.5
): [string, object] {
  return customJsonOp(username, {
    op: "swap_tokens",
    region_uid: regionUid,
    resource_amount: resourceAmount,
    shares_out: sharesOut,
    max_slippage: maxSlippage,
    resource_symbol: resourceSymbol,
  });
}

/**
 * Grants/revokes rental authority by replacing the player's `rental[]` list.
 * Pass the new full list (smart-merge upstream so other granted accounts stay).
 * Uses ACTIVE key — modifies on-chain authority state.
 */
export function buildSetAuthorityOp(
  username: string,
  rental: string[]
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [username],
      required_posting_auths: [],
      id: "sm_set_authority",
      json: JSON.stringify({
        rental,
        app: APP,
        n: generateNonce(),
      }),
    },
  ];
}

export const STAKE_TYPE_UID_LAND_WORKER = "STK-LND-WKR";

export interface StakeWorkerCard {
  card_uid: string;
  slot: number;
}

/**
 * Stake cards as workers on a deed. One op per deed. Uses POSTING key.
 */
export function buildStakeWorkersOp(
  username: string,
  deedUid: string,
  cards: StakeWorkerCard[]
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [],
      required_posting_auths: [username],
      id: "sm_stake_change",
      json: JSON.stringify({
        unstake: { cards: [], items: [] },
        stake: {
          cards: cards.map((c) => ({
            card_uid: c.card_uid,
            stake_type_uid: STAKE_TYPE_UID_LAND_WORKER,
            slot: String(c.slot),
          })),
          items: [],
        },
        deed_uid: deedUid,
        auto_buy_grain: false,
        app: APP,
        n: generateNonce(),
      }),
    },
  ];
}

export const STAKE_TYPE_UID_LAND_POWER_CORE = "STK-LND-PCR";
export const STAKE_TYPE_UID_LAND_TOTEM = "STK-LND-TOT";
export const STAKE_TYPE_UID_LAND_TITLE = "STK-LND-TTL";
export const STAKE_TYPE_UID_LAND_RUNI = "STK-LND-RUNI";

/**
 * Stake a Power Core item onto a deed. One op per deed. Uses POSTING key.
 * `itemUid` — the UID of the Power Core item (e.g. "I-322-xxxxxxxx").
 */
export function buildStakePowerCoreOp(
  username: string,
  deedUid: string,
  itemUid: string
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [],
      required_posting_auths: [username],
      id: "sm_stake_change",
      json: JSON.stringify({
        unstake: { cards: [], items: [] },
        stake: {
          cards: [],
          items: [
            {
              item_uid: itemUid,
              stake_type_uid: STAKE_TYPE_UID_LAND_POWER_CORE,
            },
          ],
        },
        deed_uid: deedUid,
        auto_buy_grain: false,
        app: APP,
        n: generateNonce(),
      }),
    },
  ];
}

/**
 * Stake DEC into a region's power-up pool. Uses POSTING key.
 * Maps to the SPL `sm_dec_powerup_region` custom_json.
 */
export function buildStakeDecRegionOp(
  username: string,
  regionUid: string,
  amount: number
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [],
      required_posting_auths: [username],
      id: "sm_dec_powerup_region",
      json: JSON.stringify({
        amount,
        region_uid: regionUid,
        app: APP,
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
  resourceSymbol: string,
  maxSlippage: number = 2.5
): [string, object] {
  return customJsonOp(username, {
    op: "swap_tokens",
    region_uid: regionUid,
    dec_amount: decAmount,
    shares_out: sharesOut,
    max_slippage: maxSlippage,
    resource_symbol: resourceSymbol,
  });
}

/**
 * Start construction of a new worksite on a deed. Uses POSTING key.
 * `opName` maps to one of: worksite_grain_construction, worksite_wood_construction,
 * worksite_iron_construction, worksite_stone_construction, worksite_research_construction,
 * worksite_aura_construction, worksite_sps_construction.
 */
export function buildWorksiteConstructionOp(
  username: string,
  regionUid: string,
  deedUid: string,
  opName: string,
  timeCrystals = 0
): [string, object] {
  return customJsonOp(username, {
    op: opName,
    region_uid: regionUid,
    deed_uids: [deedUid],
    time_crystals: timeCrystals,
  });
}

/**
 * Cancel an in-progress worksite construction on a deed. Uses POSTING key.
 * `projectId` is the `project_id` returned in the original construction result.
 */
export function buildCancelConstructionOp(
  username: string,
  regionUid: string,
  deedUid: string,
  projectId: number,
  timeCrystals = 0
): [string, object] {
  return customJsonOp(username, {
    op: "cancel_construction",
    region_uid: regionUid,
    deed_uids: [deedUid],
    time_crystals: timeCrystals,
    project_id: projectId,
    auto_buy_grain: false,
  });
}

/**
 * Feed the workers of a "ready" worksite (activate it after construction). Uses
 * POSTING key. `projectId` is the deed's active `project_id`. Pays the worksite's
 * grain cost from the region's grain; `autoBuyGrain` stays false so it never buys.
 */
export function buildUpdateWorksiteOp(
  username: string,
  regionUid: string,
  deedUid: string,
  projectId: number,
  { timeCrystals = 0, autoBuyGrain = false } = {}
): [string, object] {
  return customJsonOp(username, {
    op: "update_worksite",
    region_uid: regionUid,
    deed_uids: [deedUid],
    time_crystals: timeCrystals,
    project_id: projectId,
    auto_buy_grain: autoBuyGrain,
  });
}

/**
 * Cancel one or more active rental listings. Uses POSTING key.
 * `marketIds` — the market listing IDs of the cards to cancel.
 * Batch upstream if needed.
 */
export function buildCancelRentalOp(
  username: string,
  marketIds: string[]
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [],
      required_posting_auths: [username],
      id: "sm_market_cancel_rental",
      json: JSON.stringify({
        items: marketIds,
        app: APP,
        n: generateNonce(),
      }),
    },
  ];
}

/**
 * Unstake worker cards from a deed. One op per deed. Uses POSTING key.
 * `cardUids` — the UIDs of the worker cards to unstake.
 */
export function buildUnstakeWorkersOp(
  username: string,
  deedUid: string,
  cardUids: string[]
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [],
      required_posting_auths: [username],
      id: "sm_stake_change",
      json: JSON.stringify({
        unstake: {
          cards: cardUids.map((uid) => ({ card_uid: uid })),
          items: [],
        },
        stake: {
          cards: [],
          items: [],
        },
        deed_uid: deedUid,
        auto_buy_grain: false,
        app: APP,
        n: generateNonce(),
      }),
    },
  ];
}

/**
 * Unstake the Power Core item from a deed ("unpower" the plot). One op per
 * deed. Uses POSTING key. `itemUid` — the UID of the staked Power Core item.
 * Mirrors the stake op: the staked power core lives in the deed's `items`, so
 * we move it into the `unstake.items` list.
 */
export function buildUnstakePowerCoreOp(
  username: string,
  deedUid: string,
  itemUid: string
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [],
      required_posting_auths: [username],
      id: "sm_stake_change",
      json: JSON.stringify({
        unstake: {
          cards: [],
          items: [{ item_uid: itemUid }],
        },
        stake: {
          cards: [],
          items: [],
        },
        deed_uid: deedUid,
        auto_buy_grain: false,
        app: APP,
        n: generateNonce(),
      }),
    },
  ];
}

/**
 * Fully empty a deed in a single op: unstake every worker card AND every staked
 * item (power core, title, totem). One op per deed. Uses POSTING key.
 * `cardUids` — all staked worker card UIDs. `itemUids` — all staked item UIDs.
 * Pass empty arrays for whichever side has nothing staked.
 */
export function buildEmptyPlotOp(
  username: string,
  deedUid: string,
  cardUids: string[],
  itemUids: string[]
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [],
      required_posting_auths: [username],
      id: "sm_stake_change",
      json: JSON.stringify({
        unstake: {
          cards: cardUids.map((uid) => ({ card_uid: uid })),
          items: itemUids.map((uid) => ({ item_uid: uid })),
        },
        stake: {
          cards: [],
          items: [],
        },
        deed_uid: deedUid,
        auto_buy_grain: false,
        app: APP,
        n: generateNonce(),
      }),
    },
  ];
}

/** A card to stake, with its stake type and (for workers) target slot. */
export interface StakeChangeCard {
  card_uid: string;
  stake_type_uid: string;
  /** Worker slot (1-5). Omit for assets that don't use a slot (e.g. Runi). */
  slot?: number;
}

/** An item to stake (power core / totem / title), with its stake type. */
export interface StakeChangeItem {
  item_uid: string;
  stake_type_uid: string;
}

export interface StakeChangeInput {
  /** Cards (workers, runi) to stake. */
  stakeCards?: StakeChangeCard[];
  /** Items (power core, totem, title) to stake. */
  stakeItems?: StakeChangeItem[];
  /** Card UIDs to unstake (workers, runi). */
  unstakeCardUids?: string[];
  /** Item UIDs to unstake (power core, totem, title). */
  unstakeItemUids?: string[];
}

/**
 * One combined `sm_stake_change` op for a deed that both stakes and unstakes
 * cards and items in a single broadcast. Uses POSTING key. This backs the
 * Production-tab "Configure → Save" flow, where assigning to empty spots and
 * clearing/replacing filled spots are applied together per plot.
 */
export function buildStakeChangeOp(
  username: string,
  deedUid: string,
  input: StakeChangeInput
): [string, object] {
  const stakeCards = (input.stakeCards ?? []).map((c) => {
    const entry: Record<string, string> = {
      card_uid: c.card_uid,
      stake_type_uid: c.stake_type_uid,
    };
    if (c.slot !== undefined) entry.slot = String(c.slot);
    return entry;
  });

  return [
    "custom_json",
    {
      required_auths: [],
      required_posting_auths: [username],
      id: "sm_stake_change",
      json: JSON.stringify({
        unstake: {
          cards: (input.unstakeCardUids ?? []).map((uid) => ({
            card_uid: uid,
          })),
          items: (input.unstakeItemUids ?? []).map((uid) => ({
            item_uid: uid,
          })),
        },
        stake: {
          cards: stakeCards,
          items: input.stakeItems ?? [],
        },
        deed_uid: deedUid,
        auto_buy_grain: false,
        app: APP,
        n: generateNonce(),
      }),
    },
  ];
}

/**
 * Renew one or more rented cards via the SPL market on behalf of `player`.
 * Signed by the `serviceAccount`'s ACTIVE key (broadcast server-side) — the
 * player must have granted purchase authority to that account on Splinterlands
 * Account Security. Batch upstream with MAX_ITEM_SIZE_IN_OPERATION.
 */
export function buildRenewRentalOnBehalfOp(
  serviceAccount: string,
  player: string,
  marketIds: string[]
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [serviceAccount],
      required_posting_auths: [],
      id: "sm_market_renew_rental",
      json: JSON.stringify({
        items: marketIds,
        currency: "DEC",
        player,
        market: MARKET,
        app: APP,
        n: generateNonce(),
      }),
    },
  ];
}

/**
 * Rent cards via the SPL market on behalf of `player`. Signed by the
 * `serviceAccount`'s ACTIVE key — the player must have granted purchase
 * authority to that account on Splinterlands Account Security.
 * Batch upstream with MAX_ITEM_SIZE_IN_OPERATION.
 */
export function buildRentOnBehalfOp(
  serviceAccount: string,
  player: string,
  marketIds: string[]
): [string, object] {
  return [
    "custom_json",
    {
      required_auths: [serviceAccount],
      required_posting_auths: [],
      id: "sm_market_rent",
      json: JSON.stringify({
        currency: "DEC",
        items: marketIds,
        player,
        market: MARKET,
        app: APP,
        n: generateNonce(),
      }),
    },
  ];
}
