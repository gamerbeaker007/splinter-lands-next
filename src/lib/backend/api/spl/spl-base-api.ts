import { SPL_API_BASE } from "@/lib/shared/config/splApiConfig";
import { LoginResponse } from "@/types/auth/auth";
import { SplBalance } from "@/types/spl/balance";
import { SplInventory } from "@/types/spl/inventory";
import {
  SplMarketListing,
  SplMarketListingGrouped,
} from "@/types/spl/marketListing";
import { SplPlayerAuthorities } from "@/types/spl/playerAuthorities";
import { SplSettingsResponse } from "@/types/spl/settings";
import type { TrxLookupOutcome } from "@/types/spl/trx";
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
import { parseTrxInfo } from "./trxLookupParser";

const splBaseClient = axios.create({
  baseURL: SPL_API_BASE,
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

/**
 * Fetches a transaction by id and delegates all parsing to the trxLookupParser
 * library. Network/HTTP errors are treated as "pending" so polling can retry.
 */
export async function fetchTransactionLookup(
  trxId: string
): Promise<TrxLookupOutcome> {
  try {
    const url = "/transactions/lookup";
    const res = await splBaseClient.get(url, { params: { trx_id: trxId } });
    return parseTrxInfo(res.data?.trx_info);
  } catch {
    return { status: "pending" };
  }
}

/**
 * Tri-state confirmation of a tx by id, for broadcast verify-before-fail.
 * "confirmed" once SPL has processed it, "failed" if rejected, "pending" while
 * not yet indexed (or on a transient lookup error).
 */
export async function confirmSplTrx(
  trxId: string
): Promise<"confirmed" | "failed" | "pending"> {
  const outcome = await fetchTransactionLookup(trxId);
  if (outcome.status === "success") return "confirmed";
  if (outcome.status === "failed") return "failed";
  return "pending";
}
