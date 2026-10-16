import { PRICE_KEYS, SplPriceData } from "@/types/price";
import axios from "axios";
import * as rax from "retry-axios";
import logger from "../../log/logger.server";
import { SPL_PRICES_API } from "@/lib/shared/config/spl-endpoints";
import { splRetryConfig } from "./spl-retry";

const splPricesClient = axios.create({
  baseURL: "https://prices.splinterlands.com/",
  timeout: 30000,
  headers: {
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "User-Agent": "SPL-Data/1.0",
  },
});

rax.attach(splPricesClient);
splPricesClient.defaults.raxConfig = splRetryConfig("[spl-prices] ");

export async function getPrices(): Promise<SplPriceData> {
  const url = SPL_PRICES_API.PRICES;
  const res = await splPricesClient.get(url);
  const data = res.data;

  if (!data || typeof data !== "object") {
    logger.error(`Invalid price response: ${res.data}`);
    throw new Error("Invalid response from Splinterlands API");
  }

  // Validate required keys exist (optional but safer)
  for (const key of PRICE_KEYS) {
    if (!(key in data)) {
      throw new Error(`Missing price key: ${key}`);
    }
  }

  return data as SplPriceData;
}
