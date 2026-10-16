/**
 * Wait before each retry of a rate-limited / failing SPL request, in ms:
 * 5s, 10s, 20s, 30s, 1m, 2m, 4m, 8m50s — 8 retries, ~17 min total.
 *
 * Front-loaded so short 429 bursts recover in seconds instead of hammering SPL
 * with sub-second retries. A `Retry-After` header from SPL takes precedence.
 *
 * The server clients use the whole schedule (`spl-retry.ts`); the browser uses
 * only its head (`BROWSER_RETRY_COUNT`) — a visitor waiting on a page should
 * see an error rather than a 17-minute spinner.
 */
export const SPL_RETRY_SCHEDULE_MS = [
  5_000, 10_000, 20_000, 30_000, 60_000, 120_000, 240_000, 530_000,
];

export const BROWSER_RETRY_COUNT = 3;

/**
 * 503 is deliberately not retried: SPL answers it while the service is down,
 * and retrying with back-off only wastes time and floods logs. 429 and every
 * other 5xx are retried.
 */
export function isRetryableSplStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599 && status !== 503);
}

/** Delay before retry number `attempt` (0-based). */
export function splRetryDelayMs(attempt: number): number {
  return SPL_RETRY_SCHEDULE_MS[
    Math.min(attempt, SPL_RETRY_SCHEDULE_MS.length - 1)
  ];
}
