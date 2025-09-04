import { SplCardDetails } from "@/types/splCardDetails";
import axios from "axios";
import * as rax from "retry-axios";
import logger from "../../log/logger.server";
import { SplPlayerDetails } from "@/types/splPlayerDetails";
import { Balance } from "@/types/balance";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";

const splBaseClient = axios.create({
  baseURL: "https://api.splinterlands.com",
  timeout: 60000,
  headers: {
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "User-Agent": "SPL-Data/1.0",
  },
});

rax.attach(splBaseClient);
splBaseClient.defaults.raxConfig = {
  instance: splBaseClient,
  retry: 10,
  retryDelay: 1000,
  backoffType: "exponential",
  statusCodesToRetry: [
    [429, 429],
    [500, 599],
  ],
  onRetryAttempt: (err) => {
    const cfg = rax.getConfig(err);
    logger.warn(`Retry attempt #${cfg?.currentRetryAttempt}`);
  },
};

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

export async function fetchPlayerCardCollection(player: string) {
  const url = `cards/collection/${player}`;
  logger.info(`Fetch player card collection for: ${player}`);
  const res = await splBaseClient.get(url);

  const data = res.data;
  // Handle API-level error even if HTTP status is 200
  if (!data || typeof data !== "object" || "error" in data) {
    throw new Error(data?.error || "Invalid response from Splinterlands API");
  }

  return data.cards as SplPlayerCardCollection[];
}

export async function fetchPlayerBalances(
  player: string,
  filterTypes: string[] = [],
): Promise<Balance[]> {
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
  return data.filter((entry: Balance) => {
    return filterTypes.some((filter) => entry.token.startsWith(filter));
  });
}
