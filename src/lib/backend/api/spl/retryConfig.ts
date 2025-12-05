import * as rax from "retry-axios";
import { RetryConfig } from "retry-axios";
import logger from "../../log/logger.server";

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retry: 10,
  retryDelay: 1000,
  backoffType: "exponential",
  statusCodesToRetry: [
    [429, 429],
    [500, 599],
  ],
  onRetryAttempt: async (err) => {
    const cfg = rax.getConfig(err);
    logger.warn(`Retry attempt #${cfg?.currentRetryAttempt}`);
  },
};
