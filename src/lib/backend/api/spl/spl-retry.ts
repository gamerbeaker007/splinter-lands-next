import logger from "@/lib/backend/log/logger.server";
import {
  SPL_RETRY_SCHEDULE_MS,
  splRetryDelayMs,
} from "@/lib/shared/spl/splRetrySchedule";
import axios from "axios";
import * as rax from "retry-axios";

/**
 * retry-axios config shared by the SPL api/vapi/prices clients.
 *
 * retry-axios has no per-attempt delay list, so it runs in `static` mode and
 * `onRetryAttempt` (which fires right before the retried request) sets the
 * `retryDelay` for the *next* failure. The raxConfig object it mutates is the
 * one carried on the retried request, so the next attempt reads it.
 * A `Retry-After` header still takes precedence (retry-axios default).
 */
export function splRetryConfig(logPrefix = ""): rax.RetryConfig {
  return {
    retry: SPL_RETRY_SCHEDULE_MS.length,
    retryDelay: SPL_RETRY_SCHEDULE_MS[0],
    backoffType: "static",
    // Keep in sync with isRetryableSplStatus: 503 is excluded on purpose.
    statusCodesToRetry: [
      [429, 429],
      [500, 502],
      [504, 599],
    ],
    onRetryAttempt: async (err) => {
      const cfg = rax.getConfig(err);
      const attempt = cfg?.currentRetryAttempt ?? 0;
      if (cfg) cfg.retryDelay = splRetryDelayMs(attempt);

      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as Record<string, unknown> | undefined)?.error ??
          err.response?.statusText ??
          err.message)
        : String(err);
      logger.warn(
        `${logPrefix}Retry attempt #${attempt}${status ? ` (HTTP ${status})` : ""}: ${msg}`
      );
    },
  };
}
