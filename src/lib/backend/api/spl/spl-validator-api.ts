import axios from "axios";
import * as rax from "retry-axios";
import logger from "../../log/logger.server";
import { DEFAULT_RETRY_CONFIG } from "./retryConfig";

const validatorClient = axios.create({
  baseURL: "https://validator.spl-stats.com/",
  timeout: 10000,
  headers: {
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "User-Agent": "SPL-Data/1.0",
  },
});

rax.attach(validatorClient);
validatorClient.defaults.raxConfig = { ...DEFAULT_RETRY_CONFIG, retry: 3 };

export interface ValidatorVote {
  voter: string;
  validator: string;
  vote_weight: string;
}

export async function fetchValidatorVotesByAccount(
  account: string
): Promise<ValidatorVote[]> {
  logger.info(`Fetch validator votes for: ${account}`);
  const res = await validatorClient.get("/votes_by_account", {
    params: { account },
  });
  const data = res.data;
  if (!Array.isArray(data)) {
    throw new Error("Invalid response from validator API");
  }
  return data as ValidatorVote[];
}
