import type { PlayerTradeHubPosition } from "@/generated/prisma/client";
import { SPL_API, SPL_VAPI } from "@/lib/shared/config/spl-endpoints";
import type { SplGet } from "@/lib/shared/spl/splTransport";
import { parseTrxInfo } from "@/lib/shared/spl/trxLookupParser";
import type { RawRegionDataResponse } from "@/types/RawRegionDataResponse";
import type { RegionLiquidityInfo } from "@/types/regionLiquidityInfo";
import type { SplDeedHarvestActionsResponse } from "@/types/deedHarvest";
import type { SplDeedProjectsResponse } from "@/types/deedProjects";
import type { SplBalance } from "@/types/spl/balance";
import type { SplInventory } from "@/types/spl/inventory";
import type {
  SplHarvestableResource,
  SplHarvestableResponse,
  SplProductionOverview,
  SplProductionOverviewResponse,
  SplRegionOverviewData,
  SplRegionOverviewResponse,
} from "@/types/spl/landManager";
import type { SplLandPool, SplPlayerPoolPosition } from "@/types/spl/landPools";
import type { SplMarketListing } from "@/types/spl/marketListing";
import type { SplPlayerAuthorities } from "@/types/spl/playerAuthorities";
import type { TrxLookupOutcome } from "@/types/spl/trx";
import type { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import type { SplTaxes } from "@/types/splTaxes";
import type { StakedAssets } from "@/types/stakedAssets";

/**
 * Every SPL read that both the server and the browser perform, written once
 * against a transport (see splTransport.ts). Pure: no logger, no cookies, no
 * Node APIs — so it bundles for the browser.
 *
 * Server: `splServerReads` (lib/backend/api/spl/spl-server-reads.ts).
 * Browser: `splBrowser` (lib/frontend/spl-browser-api.ts).
 *
 * JWT reads take the token explicitly; where it comes from is the caller's
 * business (the cookie on the server, the session store in the browser).
 */

// ── Shared types ─────────────────────────────────────────────────────────────

/** A single available (unstaked) stake item, with whatever metadata the API returns. */
export interface RawAvailableStakeItem {
  uid: string;
  name: string | null;
  rarity: string | null;
  boost: number | null;
}

/**
 * A group of stake items the player owns, as returned by the `/grouped`
 * endpoint. The `available` endpoint only returns bare UIDs, so this is the
 * only place that carries the human-readable `name` and `boost` per
 * `item_detail_id` — which is embedded in every UID (`I-<item_detail_id>-...`).
 */
export interface RawGroupedStakeItem {
  itemDetailId: number;
  name: string | null;
  itemCount: number;
  boost: number | null;
}

/**
 * A group of stake cards the player can assign to a plot, as returned by the
 * `/land/stake/cards/<type>/grouped` endpoint. Each Runi is its own group (its
 * `name` embeds the card uid), so the group identifies one assignable card; the
 * uid itself comes from `fetchAvailableStakeCards`.
 */
export interface RawGroupedStakeCard {
  cardDetailId: number;
  bcx: number;
  gold: boolean;
  foil: number;
  edition: number;
  name: string;
}

/** A single available (stakeable) card, with the uid the grouped endpoint omits. */
export interface RawAvailableStakeCard {
  uid: string;
  cardDetailId: number;
  bcx: number;
  foil: number;
  edition: number;
  name: string;
}

export interface MarketListingQuery {
  cardDetailId: number;
  foil: number;
  edition: number;
  /** "rent" → rental listings (adds rental_type); "sell" → for-sale listings. */
  type: "rent" | "sell";
  /** Rental period, only meaningful for type "rent". Defaults to "season". */
  rentalType?: "season" | "daily";
  /**
   * BY-CARD level filter (market_query_by_card): integer where 99 = max level,
   * 0 = all levels, any other N = that specific level. Omitted from the
   * request when undefined (returns all levels).
   *
   * NB: the GROUPED endpoints use a different convention:
   * (string "max" / integer / omit) — see the fetch Grouped functions.
   */
  level?: number;
}

const EMPTY_REGION_BALANCE: Record<string, number> = {
  GRAIN: 0,
  WOOD: 0,
  STONE: 0,
  IRON: 0,
  AURA: 0,
  RESEARCH: 0,
};

/** Stored resource balances for a region, from its production overview. */
export function regionBalanceFrom(
  data: SplRegionOverviewData | null
): Record<string, number> {
  if (!data) return { ...EMPTY_REGION_BALANCE };
  return {
    GRAIN: data.grain?.regional_grain ?? 0,
    WOOD: data.wood ?? 0,
    STONE: data.stone ?? 0,
    IRON: data.iron ?? 0,
    AURA: data.aura ?? 0,
    RESEARCH: data.research?.current ?? 0,
  };
}

/** Map an internal foil rank to the market API's `foil` query value. */
function foilToApiValue(foil: number): number | string {
  if (foil === 1 || foil === 2) return "gold";
  if (foil === 3 || foil === 4) return "black";
  return foil; // 0 (regular) or any unmapped value
}

function assertValidPlayerId(player: string) {
  const USERNAME_REGEX = /^[a-z0-9_\-\.]{3,32}$/i;
  if (!USERNAME_REGEX.test(player)) {
    throw new Error("Invalid player identifier");
  }
}

const INVALID = "Invalid response from Splinterlands API";

/** Body of a vapi `{ data: ... }` envelope. */
function vapiData(body: unknown): unknown {
  return (body as { data?: unknown } | null)?.data;
}

/** API-level error even on HTTP 200 (`{ error: "..." }`). */
function apiError(body: unknown): string | null {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error?: unknown }).error;
    return typeof error === "string" ? error : INVALID;
  }
  return null;
}

const DEFAULT_DEED_LIMIT = 100;
const MAX_PAGES = 100; // 10,000 records with the default limit

export function createSplReads(get: SplGet) {
  // ── api: per player ────────────────────────────────────────────────────────

  /** The token, when given, adds cards only the owner may see (e.g. unbound). */
  async function fetchPlayerCardCollection(
    player: string,
    token?: string | null
  ): Promise<SplPlayerCardCollection[]> {
    assertValidPlayerId(player);
    const data = await get("api", SPL_API.CARDS_COLLECTION(player), { token });
    if (!data || typeof data !== "object" || apiError(data)) {
      throw new Error(apiError(data) ?? INVALID);
    }
    return (data as { cards: SplPlayerCardCollection[] }).cards;
  }

  /** `filterTypes` keeps only tokens starting with one of the prefixes. */
  async function fetchPlayerBalances(
    player: string,
    filterTypes: string[] = []
  ): Promise<SplBalance[]> {
    const data = await get("api", SPL_API.PLAYER_BALANCES, {
      params: { players: player },
    });
    if (!Array.isArray(data)) throw new Error(apiError(data) ?? INVALID);
    const balances = data as SplBalance[];
    if (filterTypes.length === 0) return balances;
    return balances.filter((entry) =>
      filterTypes.some((filter) => entry.token.startsWith(filter))
    );
  }

  async function fetchDecBalance(player: string): Promise<number> {
    const balances = await fetchPlayerBalances(player, ["DEC"]);
    const dec = balances.find((b) => b.token === "DEC" || b.token === "dec");
    return Number(dec?.balance ?? 0);
  }

  async function fetchPlayerInventory(player: string): Promise<SplInventory[]> {
    const data = await get("api", SPL_API.PLAYER_INVENTORY, {
      params: { username: player },
    });
    if (!Array.isArray(data)) throw new Error(apiError(data) ?? INVALID);
    return data as SplInventory[];
  }

  /**
   * The accounts each player granted rental/delegation/purchase authority to
   * via SPL Account Security.
   */
  async function fetchPlayerAuthorities(
    players: string[]
  ): Promise<SplPlayerAuthorities[]> {
    if (players.length === 0) return [];
    const data = await get("api", SPL_API.PLAYER_AUTHORITIES, {
      params: { players: players.join(",") },
    });
    if (!Array.isArray(data)) throw new Error(INVALID);
    return data as SplPlayerAuthorities[];
  }

  // ── api: market ────────────────────────────────────────────────────────────

  /**
   * Market listings for a single (card_detail_id, foil, edition) from
   * `market/market_query_by_card`, for either renting or buying. Caller still
   * does season/PP/price filtering. foil mapping: 0 → 0, 1|2 → "gold", 3|4 → "black".
   */
  async function fetchMarketListingsByCard({
    cardDetailId,
    foil,
    edition,
    type,
    rentalType = "season",
    level,
  }: MarketListingQuery): Promise<SplMarketListing[]> {
    const params: Record<string, string | number> = {
      card_detail_id: cardDetailId,
      foil: foilToApiValue(foil),
      edition,
      type,
      sort: "low_price_bcx",
    };
    if (type === "rent") params.rental_type = rentalType;
    if (level !== undefined) params.level = level;

    const data = await get("api", SPL_API.MARKET_QUERY_BY_CARD, { params });
    const items: unknown = Array.isArray(data)
      ? data
      : Array.isArray((data as { data?: unknown[] } | null)?.data)
        ? (data as { data: unknown[] }).data
        : null;
    if (!Array.isArray(items)) {
      throw new Error(
        `${INVALID} (market_query_by_card cdid=${cardDetailId} foil=${foil} ed=${edition})`
      );
    }
    // Filter out listings whose foil doesn't match the requested foil.
    return (items as SplMarketListing[]).filter((l) => l.foil === foil);
  }

  // ── api: transactions ──────────────────────────────────────────────────────

  /**
   * Looks a transaction up by id. Network/HTTP errors are treated as
   * "pending" so polling can retry.
   */
  async function fetchTransactionLookup(
    trxId: string,
    signal?: AbortSignal
  ): Promise<TrxLookupOutcome> {
    try {
      const data = await get("api", SPL_API.TRANSACTION_LOOKUP, {
        params: { trx_id: trxId },
        signal,
      });
      return parseTrxInfo(
        (data as { trx_info?: Parameters<typeof parseTrxInfo>[0] } | null)
          ?.trx_info
      );
    } catch {
      return { status: "pending" };
    }
  }

  /**
   * Tri-state confirmation of a tx by id, for broadcast verify-before-fail.
   * "confirmed" once SPL has processed it, "failed" if rejected, "pending" while
   * not yet indexed (or on a transient lookup error).
   */
  async function confirmSplTrx(
    trxId: string
  ): Promise<"confirmed" | "failed" | "pending"> {
    const outcome = await fetchTransactionLookup(trxId);
    if (outcome.status === "success") return "confirmed";
    if (outcome.status === "failed") return "failed";
    return "pending";
  }

  // ── vapi: deeds ────────────────────────────────────────────────────────────

  async function fetchRegionDataPlayer(
    player: string
  ): Promise<RawRegionDataResponse> {
    const data = vapiData(
      await get("vapi", SPL_VAPI.LAND_DEEDS, { params: { player } })
    ) as RawRegionDataResponse | undefined;
    if (!data) throw new Error(INVALID);
    return {
      deeds: data.deeds,
      worksite_details: data.worksite_details,
      staking_details: data.staking_details,
    };
  }

  async function fetchStakedAssets(deedUid: string): Promise<StakedAssets> {
    const data = vapiData(
      await get("vapi", SPL_VAPI.LAND_STAKED_ASSETS(deedUid))
    ) as Partial<StakedAssets> | undefined;
    if (!data) throw new Error(INVALID);
    return { cards: data.cards || [], items: data.items || [] };
  }

  async function fetchTaxes(deedUid: string): Promise<SplTaxes> {
    const data = vapiData(await get("vapi", SPL_VAPI.LAND_TAXES(deedUid)));
    if (!data) throw new Error(INVALID);
    return data as SplTaxes;
  }

  /**
   * One page of deed projects (internal: callers use fetchAllDeedProjects). For a deed uid it does not know the API still
   * answers `success` with a scalar `data` (`-1`); that is normalised to an
   * empty page so callers can always iterate.
   */
  async function fetchDeedProjects(
    deedUid: string,
    limit: number = DEFAULT_DEED_LIMIT,
    offset: number = 0
  ): Promise<SplDeedProjectsResponse> {
    const body = (await get("vapi", SPL_VAPI.LAND_DEED_PROJECTS(deedUid), {
      params: { limit, offset },
    })) as SplDeedProjectsResponse | null;
    if (body?.status !== "success") throw new Error(INVALID);
    return { ...body, data: Array.isArray(body.data) ? body.data : [] };
  }

  /** See fetchDeedProjects: an unknown deed uid comes back with `data: null`. */
  async function fetchDeedHarvestActions(
    deedUid: string,
    limit: number = DEFAULT_DEED_LIMIT,
    offset: number = 0
  ): Promise<SplDeedHarvestActionsResponse> {
    const body = (await get(
      "vapi",
      SPL_VAPI.LAND_DEED_REWARD_ACTIONS(deedUid),
      { params: { limit, offset } }
    )) as SplDeedHarvestActionsResponse | null;
    if (body?.status !== "success") throw new Error(INVALID);
    return { ...body, data: Array.isArray(body.data) ? body.data : [] };
  }

  /** Pages by the last record id until a short page (or MAX_PAGES). */
  async function fetchAllPages<T extends { id: number }>(
    fetchPage: (offset: number) => Promise<{ data: T[] }>,
    limit: number
  ): Promise<{ status: "success"; data: T[] }> {
    const all: T[] = [];
    let offset = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const { data } = await fetchPage(offset);
      all.push(...data);
      if (data.length < limit || data.length === 0) break;
      offset = data[data.length - 1].id;
    }
    return { status: "success", data: all };
  }

  function fetchAllDeedProjects(
    deedUid: string,
    limit: number = DEFAULT_DEED_LIMIT
  ): Promise<SplDeedProjectsResponse> {
    return fetchAllPages(
      (offset) => fetchDeedProjects(deedUid, limit, offset),
      limit
    );
  }

  function fetchAllDeedHarvestActions(
    deedUid: string,
    limit: number = DEFAULT_DEED_LIMIT
  ): Promise<SplDeedHarvestActionsResponse> {
    return fetchAllPages(
      (offset) => fetchDeedHarvestActions(deedUid, limit, offset),
      limit
    );
  }

  // ── vapi: stake items / cards ──────────────────────────────────────────────

  async function fetchGroupedStakeItems(
    player: string,
    stakeTypeUid: string,
    offset = 0,
    limit = 100
  ): Promise<RawGroupedStakeItem[]> {
    const data = vapiData(
      await get("vapi", SPL_VAPI.LAND_STAKE_ITEMS_GROUPED(stakeTypeUid), {
        params: {
          deedUid: '""',
          player,
          offset,
          limit,
          order_by: 1,
          order_by_asc: 0,
        },
      })
    ) as {
      items?: {
        item_detail_id: number;
        name?: string;
        item_count?: number;
        boost?: string | number;
      }[];
    } | null;
    return (data?.items ?? []).map((i) => ({
      itemDetailId: i.item_detail_id,
      name: i.name ?? null,
      itemCount: i.item_count ?? 0,
      boost: i.boost === undefined || i.boost === null ? null : Number(i.boost),
    }));
  }

  /**
   * Available (unstaked) items of one land stake item type (e.g. "STK-LND-TOT"
   * totems, "STK-LND-TTL" titles, "STK-LND-PCR" power cores). Paginate via `offset`.
   */
  async function fetchAvailableStakeItems(
    player: string,
    stakeTypeUid: string,
    offset = 0,
    limit = 100
  ): Promise<RawAvailableStakeItem[]> {
    const data = vapiData(
      await get("vapi", SPL_VAPI.LAND_STAKE_ITEMS_AVAILABLE(stakeTypeUid), {
        params: { deedUid: '""', player, offset, limit },
      })
    ) as {
      ids?: { uid: string; name?: string; rarity?: string; boost?: number }[];
    } | null;
    return (data?.ids ?? []).map((i) => ({
      uid: i.uid,
      name: i.name ?? null,
      rarity: i.rarity ?? null,
      boost: i.boost ?? null,
    }));
  }

  /** Number of unstaked Power Core items owned by `player`. */
  async function fetchPowerCoreCount(player: string): Promise<number> {
    const groups = await fetchGroupedStakeItems(player, "STK-LND-PCR");
    return groups.find((g) => g.name === "Power Core")?.itemCount ?? 0;
  }

  /** One page of available Power Core UIDs for `player`. */
  async function fetchPowerCoreAvailableIds(
    player: string,
    offset = 0,
    limit = 100
  ): Promise<string[]> {
    const items = await fetchAvailableStakeItems(
      player,
      "STK-LND-PCR",
      offset,
      limit
    );
    return items.map((i) => i.uid);
  }

  /**
   * Assignable groups of a land stake card type the player can stake on
   * `deedUid` (e.g. "STK-LND-RUNI"), including cards delegated to the player.
   */
  async function fetchGroupedStakeCards(
    player: string,
    stakeTypeUid: string,
    deedUid: string,
    offset = 0,
    limit = 100
  ): Promise<RawGroupedStakeCard[]> {
    const data = vapiData(
      await get("vapi", SPL_VAPI.LAND_STAKE_CARDS_GROUPED(stakeTypeUid), {
        params: {
          deedUid,
          player,
          offset,
          limit,
          order_by: 1,
          order_by_asc: 0,
          delegated: true,
          land_card_abilities: false,
        },
      })
    ) as {
      cards?: {
        card_detail_id: number;
        bcx: number;
        gold?: boolean;
        foil?: number;
        edition: number;
        name: string;
      }[];
    } | null;
    return (data?.cards ?? []).map((c) => ({
      cardDetailId: c.card_detail_id,
      bcx: c.bcx,
      gold: c.gold ?? false,
      foil: c.foil ?? 0,
      edition: c.edition,
      name: c.name,
    }));
  }

  /**
   * Individual stakeable card uids for one group from fetchGroupedStakeCards.
   * The endpoint filters by the group's attributes, so pass them verbatim.
   */
  async function fetchAvailableStakeCards(
    player: string,
    stakeTypeUid: string,
    deedUid: string,
    group: {
      cardDetailId: number;
      bcx: number;
      gold: boolean;
      edition: number;
      name: string;
    },
    offset = 0,
    limit = 100
  ): Promise<RawAvailableStakeCard[]> {
    const data = vapiData(
      await get("vapi", SPL_VAPI.LAND_STAKE_CARDS_AVAILABLE(stakeTypeUid), {
        params: {
          deedUid,
          player,
          offset,
          limit,
          card_detail_id: group.cardDetailId,
          bcx: group.bcx,
          gold: group.gold,
          edition: group.edition,
          name: group.name,
        },
      })
    ) as {
      ids?: {
        uid: string;
        card_detail_id: number;
        bcx: number;
        foil?: number;
        edition: number;
        name: string;
      }[];
    } | null;
    return (data?.ids ?? []).map((c) => ({
      uid: c.uid,
      cardDetailId: c.card_detail_id,
      bcx: c.bcx,
      foil: c.foil ?? 0,
      edition: c.edition,
      name: c.name,
    }));
  }

  // ── vapi: liquidity ────────────────────────────────────────────────────────

  async function fetchPlayerLiquidity(
    player: string
  ): Promise<RegionLiquidityInfo[]> {
    const data = vapiData(
      await get("vapi", SPL_VAPI.LAND_LIQUIDITY_REGION(player))
    );
    if (!data) throw new Error(INVALID);
    return data as RegionLiquidityInfo[];
  }

  async function fetchPlayerPoolInfo(
    player: string
  ): Promise<PlayerTradeHubPosition[]> {
    const data = vapiData(
      await get("vapi", SPL_VAPI.LAND_LIQUIDITY_POOLS_ALL(player))
    ) as { all: { positions: PlayerTradeHubPosition[] } } | undefined;
    if (!data) throw new Error(INVALID);

    return data.all.positions
      .filter((pos) => pos.token !== "DEC-VOUCHER")
      .map(
        (pos) =>
          ({
            player,
            token: pos.token,
            balance: pos.balance,
            total_fees_earned_dec: pos.total_fees_earned_dec,
            total_fees_earned_resource: pos.total_fees_earned_resource,
            fees_earned_dec_1: pos.fees_earned_dec_1,
            fees_earned_resource_1: pos.fees_earned_resource_1,
            fees_earned_dec_30: pos.fees_earned_dec_30,
            fees_earned_resource_30: pos.fees_earned_resource_30,
            share_percentage: 0,
          }) as PlayerTradeHubPosition
      );
  }

  /**
   * The player's liquidity position in ONE resource pool. The endpoint returns
   * two `single` entries: `DEC-<RESOURCE>` (total LP shares) and
   * `VESTING-<RESOURCE>` (shares still inside the 30-day lock).
   */
  async function fetchPlayerResourcePoolPosition(
    player: string,
    symbol: string
  ): Promise<SplPlayerPoolPosition> {
    const data = vapiData(
      await get("vapi", SPL_VAPI.LAND_LIQUIDITY_POOL(player, symbol))
    ) as { single?: { token: string; balance: number | string }[] } | null;
    const single = data?.single ?? [];
    const balanceOf = (token: string): number =>
      Number(single.find((s) => s.token === token)?.balance ?? 0) || 0;
    return {
      symbol,
      shares: balanceOf(`DEC-${symbol}`),
      vestingShares: balanceOf(`VESTING-${symbol}`),
    };
  }

  async function fetchLandResourcesPools(): Promise<SplLandPool[]> {
    const data = vapiData(await get("vapi", SPL_VAPI.LAND_LIQUIDITY_LANDPOOLS));
    if (!data) throw new Error(INVALID);
    return (data as SplLandPool[]) || [];
  }

  // ── vapi: JWT production reads ─────────────────────────────────────────────

  async function fetchProductionOverview(
    player: string,
    token: string
  ): Promise<SplProductionOverview> {
    const response = (await get("vapi", SPL_VAPI.LAND_PRODUCTION_OVERVIEW, {
      params: { player },
      token,
    })) as SplProductionOverviewResponse | null;
    if (!response?.data) throw new Error(INVALID);
    return {
      regions: response.data.regions.items ?? [],
      totalDecStaked: response.data.dark_energy?.total_dec_staked ?? 0,
    };
  }

  async function fetchSplHarvestableResources(
    player: string,
    regionUid: string,
    token: string
  ): Promise<SplHarvestableResource[]> {
    const response = (await get("vapi", SPL_VAPI.LAND_REGION_HARVESTABLE, {
      params: { player, region_uid: regionUid },
      token,
    })) as SplHarvestableResponse | null;
    if (!response?.data) throw new Error(INVALID);
    return Array.isArray(response.data) ? response.data : [];
  }

  /**
   * The full region production overview: stored balances, the per-plot worksite
   * rows (including `grain_req_per_hour`) and the region's `resource_recipes`.
   * Resolves to null on failure (callers treat that as an all-zero balance).
   */
  async function fetchRegionOverview(
    player: string,
    regionUid: string,
    token: string
  ): Promise<SplRegionOverviewData | null> {
    try {
      const body = (await get("vapi", SPL_VAPI.LAND_REGION_OVERVIEW, {
        params: { player, region_uid: regionUid },
        token,
      })) as SplRegionOverviewResponse | null;
      return body?.data ?? null;
    } catch {
      return null;
    }
  }

  return {
    fetchPlayerCardCollection,
    fetchPlayerBalances,
    fetchDecBalance,
    fetchPlayerInventory,
    fetchPlayerAuthorities,
    fetchMarketListingsByCard,
    fetchTransactionLookup,
    confirmSplTrx,
    fetchRegionDataPlayer,
    fetchStakedAssets,
    fetchTaxes,
    fetchAllDeedProjects,
    fetchAllDeedHarvestActions,
    fetchGroupedStakeItems,
    fetchAvailableStakeItems,
    fetchPowerCoreCount,
    fetchPowerCoreAvailableIds,
    fetchGroupedStakeCards,
    fetchAvailableStakeCards,
    fetchPlayerLiquidity,
    fetchPlayerPoolInfo,
    fetchPlayerResourcePoolPosition,
    fetchLandResourcesPools,
    fetchProductionOverview,
    fetchSplHarvestableResources,
    fetchRegionOverview,
  };
}
