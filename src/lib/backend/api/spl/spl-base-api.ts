import { LoginResponse } from "@/types/auth/auth";
import { SplBalance } from "@/types/spl/balance";
import { SplInventory } from "@/types/spl/inventory";
import {
  SplMarketListing,
  SplMarketListingGrouped,
} from "@/types/spl/marketListing";
import { SplPlayerAuthorities } from "@/types/spl/playerAuthorities";
import { SplSettingsResponse } from "@/types/spl/settings";
import type {
  AddLiquidityTrxData,
  DecPowerupRegionTrxData,
  HarvestAllTrxData,
  MarketPurchaseTrxData,
  MarketRentTrxData,
  SetAuthorityTrxData,
  SplTrxResult,
  StakeChangeTrxData,
  SwapTokensOpInput,
  SwapTokensTrxData,
  TaxCollectionTrxData,
  TrxLookupOutcome,
} from "@/types/spl/trx";
import { SplCardDetails } from "@/types/splCardDetails";
import { SplMarketCardData } from "@/types/splMarketCardData";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import { SplPlayerDetails } from "@/types/splPlayerDetails";
import axios from "axios";
import { cookies } from "next/headers";
import * as rax from "retry-axios";
import { validateSplJwt } from "../../jwt/splJwtValidation";
import logger from "../../log/logger.server";
import { DEFAULT_RETRY_CONFIG } from "./retryConfig";

const splBaseClient = axios.create({
  baseURL: "https://api.splinterlands.com",
  timeout: 60000,
  headers: {
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "User-Agent": "SPL-Data/1.0",
  },
});

rax.attach(splBaseClient);
splBaseClient.defaults.raxConfig = DEFAULT_RETRY_CONFIG;

/**
 * Helper function to get the JWT token from cookies in server-side contexts
 */
export async function getAuthorizationHeader(
  player: string
): Promise<Record<string, string> | undefined> {
  try {
    const cookieStore = await cookies();
    const jwtCookie = cookieStore.get("jwt_token")?.value || "";
    const authToken = await validateSplJwt(jwtCookie);
    const headers: Record<string, string> = {};
    if (authToken && authToken.valid && authToken.username === player) {
      headers.Authorization = `Bearer ${jwtCookie}`;
      logger.info(`Using Bearer token for authenticated request`);
    }

    return headers || undefined;
  } catch (error) {
    logger.warn(`Failed to read auth token from cookies: ${error}`);
    return undefined;
  }
}

export async function splLogin(
  username: string,
  timestamp: number,
  signature: string
): Promise<LoginResponse> {
  const url = "players/v2/login";

  logger.info(`splLogin called for user: ${username}`);
  const params = {
    name: username,
    ts: timestamp,
    sig: signature,
  };

  try {
    const response = await splBaseClient.get(url, {
      params: { ...params },
    });

    if (response.status === 200 && response.data) {
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      return response.data as LoginResponse;
    } else {
      throw new Error("Login request failed");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data;
      if (errorData && typeof errorData === "object" && "error" in errorData) {
        throw new Error(errorData.error);
      }
      throw new Error(error.message || "Network error occurred");
    }
    throw error;
  }
}

export async function fetchCardDetails() {
  const url = "/cards/get_details";

  const res = await splBaseClient.get(url);
  const data = res.data ?? [];
  if (!data) throw new Error("Invalid response from Splinterlands API");

  return Array.isArray(data) ? (data as SplCardDetails[]) : [];
}

export async function fetchPlayerDetails(player: string) {
  const url = "/players/details";
  logger.info(`Fetch player detail for: ${player}`);
  const res = await splBaseClient.get(url, {
    params: { name: player },
  });

  const data = res.data;

  // Handle API-level error even if HTTP status is 200
  if (!data || typeof data !== "object" || "error" in data) {
    throw new Error(data?.error || "Invalid response from Splinterlands API");
  }

  return data as SplPlayerDetails;
}

function assertValidPlayerId(player: string) {
  // Adjust rules to whatever Splinterlands usernames allow
  const USERNAME_REGEX = /^[a-z0-9_\-\.]{3,32}$/i;

  if (!USERNAME_REGEX.test(player)) {
    throw new Error("Invalid player identifier");
  }
}

/**
 * Fetches player card collection from Splinterlands API.
 * Pass skipAuth=true in script/background contexts where cookies() is unavailable.
 */
export async function fetchPlayerCardCollection(
  player: string,
  skipAuth = false
) {
  assertValidPlayerId(player);
  const url = `cards/collection/${encodeURIComponent(player)}`;
  logger.info(`Fetch player card collection for: ${player}`);
  const headers = skipAuth ? undefined : await getAuthorizationHeader(player);

  const res = await splBaseClient.get(url, {
    headers,
  });

  const data = res.data;
  // Handle API-level error even if HTTP status is 200
  if (!data || typeof data !== "object" || "error" in data) {
    throw new Error(data?.error || "Invalid response from Splinterlands API");
  }

  return data.cards as SplPlayerCardCollection[];
}

export async function fetchMarketCardData() {
  const url = `market/for_sale_grouped`;
  logger.info("Fetch market card data");
  const res = await splBaseClient.get(url);

  const data = res.data;
  // Handle API-level error even if HTTP status is 200
  if (!data || typeof data !== "object" || "error" in data) {
    throw new Error(data?.error || "Invalid response from Splinterlands API");
  }

  return data as SplMarketCardData[];
}

export async function fetchMarketForRentGrouped(): Promise<
  SplMarketListingGrouped[]
> {
  const url = "market/for_rent_grouped";
  logger.info("Fetch market for-rent grouped");
  const params = {
    level: "max",
  };
  const res = await splBaseClient.get(url, { params });

  const data = res.data;
  if (!Array.isArray(data)) {
    throw new Error("Invalid response from Splinterlands API");
  }
  return data as SplMarketListingGrouped[];
}

/** Map an internal foil rank to the market API's `foil` query value. */
function foilToApiValue(foil: number): number | string {
  if (foil === 1 || foil === 2) return "gold";
  if (foil === 3 || foil === 4) return "black";
  return foil; // 0 (regular) or any unmapped value
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
   * NB: the GROUPED endpoints usea different convention:
   * (string "max" / integer / omit) — see the fetch Grouped functions.
   */
  level?: number;
}

/**
 * Returns market listings for a single (card_detail_id, foil, edition) from
 * `market/market_query_by_card`, for either renting or buying. Caller still
 * does season/PP/price filtering.
 *
 * foil mapping: 0 → 0, 1|2 → "gold", 3|4 → "black".
 */
export async function fetchMarketListingsByCard({
  cardDetailId,
  foil,
  edition,
  type,
  rentalType = "season",
  level,
}: MarketListingQuery): Promise<SplMarketListing[]> {
  const url = "market/market_query_by_card";
  logger.info(
    `Fetch market ${type} listings for cdid=${cardDetailId} foil=${foil} ed=${edition}` +
      (level === undefined ? "" : ` level=${level}`)
  );

  const params: Record<string, string | number> = {
    card_detail_id: cardDetailId,
    foil: foilToApiValue(foil),
    edition,
    type,
    sort: "low_price_bcx",
  };
  if (type === "rent") params.rental_type = rentalType;
  if (level !== undefined) params.level = level;

  const res = await splBaseClient.get(url, { params });

  const data = res.data;
  const items: unknown = Array.isArray(data)
    ? data
    : Array.isArray((data as { data?: unknown[] })?.data)
      ? (data as { data: unknown[] }).data
      : null;
  if (!Array.isArray(items)) {
    logger.warn(
      `[market] ${url} unexpected response shape for cdid=${cardDetailId} foil=${foil} ed=${edition}: ${JSON.stringify(data).slice(0, 300)}`
    );
    throw new Error("Invalid response from Splinterlands API");
  }

  // Filter out listings whose foil doesn't match the requested foil.
  return (items as SplMarketListing[]).filter(
    (listing) => listing.foil === foil
  );
}

/**
 * Grouped for-sale market snapshot — the buy ("purchase") counterpart of
 * {@link fetchMarketForRentGrouped}.
 *
 * `level` conventions for the GROUPED endpoints (for_rent_grouped /
 * for_sale_grouped):
 *   - an integer (e.g. 4) selects that specific card level,
 *   - the string "max" selects the max level,
 *   - omitting the param returns all levels.
 * We keep "max" for now to mirror the rental flow.
 */
export async function fetchMarketForSaleGrouped(): Promise<
  SplMarketListingGrouped[]
> {
  const url = "market/for_sale_grouped";
  logger.info("Fetch market for-sale grouped");
  const params = {
    level: "max",
  };
  const res = await splBaseClient.get(url, { params });

  const data = res.data;
  if (!Array.isArray(data)) {
    throw new Error("Invalid response from Splinterlands API");
  }
  return data as SplMarketListingGrouped[];
}

export async function fetchSettings(): Promise<SplSettingsResponse | null> {
  try {
    const res = await splBaseClient.get("/settings");
    const data = res.data;
    if (data && typeof data === "object" && "season" in data) {
      return data as SplSettingsResponse;
    }
    logger.warn(
      `[rental] /settings response missing 'season' key: ${JSON.stringify(data).slice(0, 200)}`
    );
    return null;
  } catch (err) {
    logger.warn(`[rental] /settings fetch failed: ${err}`);
    return null;
  }
}

export async function fetchPlayerBalances(
  player: string,
  filterTypes: string[] = []
): Promise<SplBalance[]> {
  const url = "/players/balances";
  logger.info(`Fetch balances for: ${player}, with filters: ${filterTypes}`);

  const res = await splBaseClient.get(url, {
    params: { players: player },
  });

  const data = res.data;

  if (!Array.isArray(data)) {
    logger.error("Invalid response format from Splinterlands API", data);
    throw new Error(data?.error || "Invalid response from Splinterlands API");
  }

  if (filterTypes.length === 0) {
    return data;
  }
  return data.filter((entry: SplBalance) => {
    return filterTypes.some((filter) => entry.token.startsWith(filter));
  });
}

export async function fetchBurnedBalances(): Promise<SplBalance[]> {
  const url = "/players/balances";
  const player = "$BURNED_CARDS";
  logger.info(`Fetch balances for: ${player}`);

  const res = await splBaseClient.get(url, {
    params: { players: player },
  });

  const data = res.data;

  if (!Array.isArray(data)) {
    logger.error("Invalid response format from Splinterlands API", data);
    throw new Error(data?.error || "Invalid response from Splinterlands API");
  }
  return data;
}

export async function fetchPlayerInventory(
  player: string
): Promise<SplInventory[]> {
  const url = "/players/inventory";
  logger.info(`Fetch player inventory`);

  const res = await splBaseClient.get(url, {
    params: { username: player },
  });

  const data = res.data;

  if (!Array.isArray(data)) {
    logger.error("Invalid response format from Splinterlands API", data);
    throw new Error(data?.error || "Invalid response from Splinterlands API");
  }
  return data;
}

// ── Rental / delegation authorities ──────────────────────────────────────────

/**
 * Returns the list of accounts each player has granted
 * rental/delegation/purchase authority to via SPL Account Security. The
 * `rental` bucket is the one the land-service account must appear in to sign
 * `sm_market_rent` on behalf of the player.
 */
export async function fetchPlayerAuthorities(
  players: string[]
): Promise<SplPlayerAuthorities[]> {
  if (players.length === 0) return [];
  const url = "/players/authorities";
  const res = await splBaseClient.get(url, {
    params: { players: players.join(",") },
  });
  const data = res.data;
  if (!Array.isArray(data)) {
    logger.error("Invalid response format from /players/authorities", data);
    throw new Error("Invalid response from Splinterlands API");
  }
  return data as SplPlayerAuthorities[];
}

// ── Transaction lookup ────────────────────────────────────────────────────────

type Raw = Record<string, unknown>;

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

function parseSwapTokensInput(opInput: Raw): SwapTokensOpInput {
  return {
    region_uid: (opInput.region_uid as string) ?? "",
    resource_amount: (opInput.resource_amount as number) ?? 0,
    resource_symbol: (opInput.resource_symbol as string) ?? "",
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

function parseDecPowerupRegion(d: Raw): DecPowerupRegionTrxData {
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
      (harvestData.results as DecPowerupRegionTrxData["harvest_results"]) ?? [],
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

export async function fetchTransactionLookup(
  trxId: string
): Promise<TrxLookupOutcome> {
  try {
    const url = "/transactions/lookup";
    const res = await splBaseClient.get(url, { params: { trx_id: trxId } });
    const trxInfo = res.data?.trx_info;

    // Not yet on-chain — trx_info absent
    if (!trxInfo) return { status: "pending" };

    // On-chain but rejected by the game engine
    if (trxInfo.success === false) {
      const error: string =
        trxInfo.error ?? trxInfo.error_code ?? "Transaction failed";
      return { status: "failed", error };
    }

    if (!trxInfo.result) return { status: "pending" };

    const outer = JSON.parse(trxInfo.result as string);

    const opData = JSON.parse(trxInfo.data as string) as Raw & { op?: string };
    // sm_land_operation ops carry the op type in data.op; sm_market_rent /
    // sm_stake_change have no `op` field and are identified by trx_info.type.
    const op = opData.op ?? (trxInfo.type as string | undefined);

    let result: SplTrxResult | null = null;
    switch (op) {
      case "harvest_all":
      case "swap_tokens":
      case "tax_collection":
      case "add_liquidity":
      case "dec_powerup_region": {
        if (outer?.result?.success === false) {
          const error: string =
            outer?.result?.error ?? outer?.error ?? "Transaction failed";
          return { status: "failed", error };
        }
        const d = outer?.result?.data as Raw | null;
        if (!d) return { status: "pending" };
        if (op === "harvest_all")
          result = { type: "harvest_all", data: parseHarvestAll(d) };
        else if (op === "swap_tokens")
          result = {
            type: "swap_tokens",
            input: parseSwapTokensInput(opData),
            data: parseSwapTokens(d),
          };
        else if (op === "tax_collection")
          result = { type: "tax_collection", data: parseTaxCollection(d) };
        else if (op === "add_liquidity")
          result = { type: "add_liquidity", data: parseAddLiquidity(d) };
        else
          result = {
            type: "dec_powerup_region",
            data: parseDecPowerupRegion(d),
          };
        break;
      }
      case "market_rent": {
        if (outer?.success === false) {
          const error: string =
            (outer?.error as string) ?? "Rent transaction failed";
          return { status: "failed", error };
        }
        result = { type: "market_rent", data: parseMarketRent(outer as Raw) };
        break;
      }
      case "market_renew_rental": {
        if (outer?.success === false) {
          const error: string =
            (outer?.error as string) ?? "Renew rental transaction failed";
          return { status: "failed", error };
        }
        result = {
          type: "market_renew_rental",
          data: parseMarketRent(outer as Raw),
        };
        break;
      }
      case "market_purchase": {
        if (outer?.success === false) {
          const error: string =
            (outer?.error as string) ?? "Purchase transaction failed";
          return { status: "failed", error };
        }
        result = {
          type: "market_purchase",
          data: parseMarketPurchase(outer as Raw),
        };
        break;
      }
      case "stake_change": {
        const code = outer?.result_code;
        if (typeof code === "number" && code !== 0) {
          const error: string =
            (outer?.error_message as string) ?? "Stake change failed";
          return { status: "failed", error };
        }
        result = {
          type: "stake_change",
          data: parseStakeChange(outer as Raw),
        };
        break;
      }
      case "set_authority": {
        if (outer?.success === false) {
          const error: string =
            (outer?.error as string) ?? "set_authority failed";
          return { status: "failed", error };
        }
        const auth = outer?.authority as {
          rental?: string[];
          purchase?: string[];
          delegation?: string[];
        } | null;
        if (!auth) return { status: "pending" };
        result = {
          type: "set_authority",
          data: {
            rental: Array.isArray(auth.rental) ? auth.rental : [],
            purchase: Array.isArray(auth.purchase) ? auth.purchase : [],
            delegation: Array.isArray(auth.delegation) ? auth.delegation : [],
          } satisfies SetAuthorityTrxData,
        };
        break;
      }
      case "worksite_grain_construction":
      case "worksite_wood_construction":
      case "worksite_iron_construction":
      case "worksite_stone_construction":
      case "worksite_research_construction":
      case "worksite_aura_construction":
      case "worksite_sps_construction": {
        if (outer?.result?.success === false) {
          const error: string =
            outer?.result?.error ?? outer?.error ?? "Construction failed";
          return { status: "failed", error };
        }
        const d = outer?.result?.data as Raw | null;
        if (!d) return { status: "pending" };
        result = {
          type: "worksite_construction",
          data: {
            project_type: op,
            deed_uid: (d.deed_uid as string | undefined) ?? "",
            project_id: (d.project_id as number | undefined) ?? 0,
          },
        };
        break;
      }
      case "cancel_construction": {
        if (outer?.result?.success === false) {
          const error: string =
            outer?.result?.error ??
            outer?.error ??
            "Cancel construction failed";
          return { status: "failed", error };
        }
        const d = outer?.result?.data as Raw | null;
        if (!d) return { status: "pending" };
        result = {
          type: "cancel_construction",
          data: {
            deed_uid: (d.deed_uid as string | undefined) ?? "",
            project_id: (d.project_id as number | undefined) ?? 0,
          },
        };
        break;
      }
      case "update_worksite": {
        if (outer?.result?.success === false) {
          const error: string =
            outer?.result?.error ?? outer?.error ?? "Feed workers failed";
          return { status: "failed", error };
        }
        const d = outer?.result?.data as Raw | null;
        if (!d) return { status: "pending" };
        result = {
          type: "update_worksite",
          data: {
            deed_uid: (d.deed_uid as string | undefined) ?? "",
            region_number: (d.region_number as number | undefined) ?? 0,
            plot_number: (d.plot_number as number | undefined) ?? 0,
            dec_spent: (d.dec_spent as number | undefined) ?? 0,
            result_message: (d.result_message as string | undefined) ?? "",
          },
        };
        break;
      }
      default:
        return { status: "pending" };
    }
    return { status: "success", result };
  } catch {
    return { status: "pending" };
  }
}
