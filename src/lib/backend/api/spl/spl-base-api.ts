import { LoginResponse } from "@/types/auth/auth";
import { SplBalance } from "@/types/spl/balance";
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
 * Fetches player card collection from Splinterlands API
 * Always includes auth headers if available for the player
 */
export async function fetchPlayerCardCollection(player: string) {
  assertValidPlayerId(player);
  const url = `cards/collection/${encodeURIComponent(player)}`;
  logger.info(`Fetch player card collection for: ${player}`);
  const headers = await getAuthorizationHeader(player);

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
