import { LoginResponse } from "@/types/auth/auth";
import { SplBalance } from "@/types/spl/balance";
import { SplInventory } from "@/types/spl/inventory";
import type {
  AddLiquidityTrxData,
  HarvestAllTrxData,
  SplTrxResult,
  SwapTokensOpInput,
  SwapTokensTrxData,
  TaxCollectionTrxData,
  TrxLookupOutcome,
} from "@/types/spl/trx";
import { SplCardDetails } from "@/types/splCardDetails";
import { SplMarketCardData } from "@/types/splMarketCardData copy";
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

    return headers ? headers : undefined;
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
      const result = response.data as LoginResponse;

      return result as LoginResponse;
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
    if (outer?.result?.success === false) {
      const error: string =
        outer?.result?.error ?? outer?.error ?? "Transaction failed";
      return { status: "failed", error };
    }

    const d = outer.result.data as Raw | null;
    if (!d) return { status: "pending" };

    const opData = JSON.parse(trxInfo.data as string) as Raw & { op: string };
    const op = opData.op;

    let result: SplTrxResult | null = null;
    switch (op) {
      case "harvest_all":
        result = { type: "harvest_all", data: parseHarvestAll(d) };
        break;
      case "swap_tokens":
        result = {
          type: "swap_tokens",
          input: parseSwapTokensInput(opData),
          data: parseSwapTokens(d),
        };
        break;
      case "tax_collection":
        result = { type: "tax_collection", data: parseTaxCollection(d) };
        break;
      case "add_liquidity":
        result = { type: "add_liquidity", data: parseAddLiquidity(d) };
        break;
      default:
        return { status: "pending" };
    }
    return { status: "success", result };
  } catch {
    return { status: "pending" };
  }
}
