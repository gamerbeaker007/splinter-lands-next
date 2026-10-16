/**
 * The one seam between SPL read logic and *how* a request is sent.
 *
 * `createSplReads` (splReads.ts) is written once against this interface; the
 * server binds it to its axios clients (spl-base-api / spl-land-api, with the
 * long `splRetryConfig` back-off) and the browser binds it to `fetch`
 * (lib/frontend/spl-browser-api.ts). So server and browser share parsing and
 * validation and differ only in transport, auth source and retry budget.
 */

export type SplHost = "api" | "vapi";

export type SplQueryValue = string | number | boolean | undefined;

export interface SplRequest {
  params?: Record<string, SplQueryValue>;
  /** SPL JWT — sent as `Authorization: Bearer <token>` when present. */
  token?: string | null;
  signal?: AbortSignal;
}

/** Resolves to the parsed JSON body, or throws (see {@link SplHttpError}). */
export type SplGet = (
  host: SplHost,
  path: string,
  request?: SplRequest
) => Promise<unknown>;

/** A non-2xx SPL answer. Transports throw this so callers can read `status`. */
export class SplHttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "SplHttpError";
  }
}
