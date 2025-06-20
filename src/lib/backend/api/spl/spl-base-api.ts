import { logger } from "@/lib/backend/log/logger";
import { SplCardDetails } from "@/types/splCardDetails";
import axios from "axios";
import * as rax from "retry-axios";

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
