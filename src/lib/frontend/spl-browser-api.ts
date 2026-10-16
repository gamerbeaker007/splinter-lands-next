"use client";

import { SPL_API_BASE, SPL_VAPI_BASE } from "@/lib/shared/config/splApiConfig";
import { SPL_API } from "@/lib/shared/config/spl-endpoints";
import { createSplReads } from "@/lib/shared/spl/splReads";
import {
  BROWSER_RETRY_COUNT,
  isRetryableSplStatus,
  splRetryDelayMs,
} from "@/lib/shared/spl/splRetrySchedule";
import {
  SplHttpError,
  type SplGet,
  type SplRequest,
} from "@/lib/shared/spl/splTransport";
import { reportUnauthorized } from "@/lib/frontend/splSession";

/**
 * The only path for every "browser (live)" SPL data type (see CLAUDE.md):
 * per-player deeds, staked assets, taxes, balances, liquidity, stake items,
 * collection, inventory, details, authorities, the JWT production reads, and
 * tx lookup polling. These reads count against the visitor's IP rate limit
 * instead of the server's. The SPL hosts answer CORS for any origin (incl. the
 * `Authorization` header); they are allowed in the CSP `connect-src`
 * (`next.config.ts`).
 *
 * No server fallback: a visitor who can't reach SPL from the browser can't play
 * the game either. Failures throw and surface through the caller's error state.
 *
 * JWT reads take the token from the session store (splSession.ts); a 401 on a
 * token clears the session everywhere.
 */

const BROWSER_TIMEOUT_MS = 15_000;

function buildUrl(base: string, path: string, request: SplRequest): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(request.params ?? {})) {
    if (value !== undefined) query.set(key, String(value));
  }
  const qs = query.toString();
  return `${base}${path}${qs ? `?${qs}` : ""}`;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true }
    );
  });
}

/** `Retry-After` in ms (seconds or an HTTP date), or null. */
function retryAfterMs(res: Response): number | null {
  const header = res.headers.get("Retry-After");
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const date = Date.parse(header);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

const browserGet: SplGet = async (host, path, request = {}) => {
  const base = host === "api" ? SPL_API_BASE : SPL_VAPI_BASE;
  const url = buildUrl(base, path, request);
  const headers: Record<string, string> = {};
  if (request.token) headers.Authorization = `Bearer ${request.token}`;

  for (let attempt = 0; ; attempt++) {
    const timeout = AbortSignal.timeout(BROWSER_TIMEOUT_MS);
    const signal = request.signal
      ? AbortSignal.any([request.signal, timeout])
      : timeout;
    const res = await fetch(url, { headers, signal });

    if (res.ok) return res.json();

    if (res.status === 401 && request.token) reportUnauthorized(request.token);
    if (attempt < BROWSER_RETRY_COUNT && isRetryableSplStatus(res.status)) {
      await sleep(
        retryAfterMs(res) ?? splRetryDelayMs(attempt),
        request.signal
      );
      continue;
    }
    throw new SplHttpError(
      res.status,
      `Splinterlands ${path} returned HTTP ${res.status}`
    );
  }
};

/** The shared SPL reads (lib/shared/spl/splReads.ts), bound to `fetch`. */
export const splBrowser = createSplReads(browserGet);

export interface SplLoginResult {
  name: string;
  token: string;
}

/**
 * Exchanges a Keychain signature of `${username}${timestamp}` for an SPL JWT,
 * straight from the browser. The server then verifies and stores it
 * (`establishSessionAction`).
 */
export async function splLoginInBrowser(
  username: string,
  timestamp: number,
  signature: string
): Promise<SplLoginResult> {
  let body: { name?: string; jwt_token?: string; error?: string } | null;
  try {
    body = (await browserGet("api", SPL_API.LOGIN, {
      params: { name: username, ts: timestamp, sig: signature },
    })) as typeof body;
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Network error during login"
    );
  }
  if (body?.error) throw new Error(body.error);
  if (!body?.jwt_token) throw new Error("No token received from Splinterlands");
  return { name: body.name ?? username, token: body.jwt_token };
}
