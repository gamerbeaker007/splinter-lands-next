import * as rax from "retry-axios";
import { RetryConfig } from "retry-axios";
import logger from "../../log/logger.server";

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retry: 10,
  retryDelay: 1000,
  backoffType: "exponential",
  // 503 Service Unavailable is explicitly excluded: the SPL API returns it when
  // the service is down and retrying 10× with back-off wastes time / floods logs.
  // All other 5xx and 429 (rate-limit) are still retried.
  statusCodesToRetry: [
    [429, 429],
    [500, 502],
    [504, 599],
  ],
  onRetryAttempt: async (err) => {
    const cfg = rax.getConfig(err);
    logger.warn(`Retry attempt #${cfg?.currentRetryAttempt}`);
  },
};
