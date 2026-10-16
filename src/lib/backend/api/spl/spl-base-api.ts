import { SPL_API } from "@/lib/shared/config/spl-endpoints";
import { SplBalance } from "@/types/spl/balance";
import { SplMarketListingGrouped } from "@/types/spl/marketListing";
import { SplSettingsResponse } from "@/types/spl/settings";
import { SplCardDetails } from "@/types/splCardDetails";
import { SplMarketCardData } from "@/types/splMarketCardData";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import axios from "axios";
import logger from "../../log/logger.server";
import { splBaseClient, splServerReads } from "./spl-clients";

/**
 * Server-side api.splinterlands.com reads. The per-player reads are the shared
 * implementations (lib/shared/spl/splReads.ts) bound to the server client —
 * re-exported here for the server callers that still need them (on-behalf
 * validation, donation verify, the worker). Browser code uses
 * lib/frontend/spl-browser-api.ts instead.
 */
export const fetchPlayerAuthorities = splServerReads.fetchPlayerAuthorities;
export const fetchMarketListingsByCard =
  splServerReads.fetchMarketListingsByCard;
export const fetchTransactionLookup = splServerReads.fetchTransactionLookup;
export const confirmSplTrx = splServerReads.confirmSplTrx;

type TokenVerifyResult = "valid" | "invalid" | "error";

/**
 * Verifies a JWT by calling an authenticated SPL endpoint (balance_history limit=1).
 * - "valid":   SPL accepted the Bearer token for this username → genuinely issued
 * - "invalid": SPL returned 401 or an error body → token is forged or revoked
 * - "error":   transient network/5xx failure → caller handles
 */
export async function verifySplJwt(
  username: string,
  jwtToken: string
): Promise<TokenVerifyResult> {
  try {
    const res = await splBaseClient.get(SPL_API.PLAYER_BALANCE_HISTORY, {
      headers: { Authorization: `Bearer ${jwtToken}` },
      params: { username, token_type: "SPS", limit: 1 },
    });
    const data = res.data;
    if (Array.isArray(data)) return "valid";
    if (data && typeof data === "object" && "error" in data) return "invalid";
    return "invalid";
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401)
      return "invalid";
    return "error";
  }
}

export async function fetchCardDetails() {
  const url = SPL_API.CARD_DETAILS;

  const res = await splBaseClient.get(url);
  const data = res.data ?? [];
  if (!data) throw new Error("Invalid response from Splinterlands API");

  return Array.isArray(data) ? (data as SplCardDetails[]) : [];
}

export async function fetchMarketCardData() {
  const url = SPL_API.MARKET_FOR_SALE_GROUPED;
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
  const url = SPL_API.MARKET_FOR_RENT_GROUPED;
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
  const url = SPL_API.MARKET_FOR_SALE_GROUPED;
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
    const res = await splBaseClient.get(SPL_API.SETTINGS);
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

export async function fetchBurnedBalances(): Promise<SplBalance[]> {
  const url = SPL_API.PLAYER_BALANCES;
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

/** Card collection without owner-only cards — for the worker (no cookies there). */
export function fetchPlayerCardCollection(
  player: string
): Promise<SplPlayerCardCollection[]> {
  return splServerReads.fetchPlayerCardCollection(player);
}
