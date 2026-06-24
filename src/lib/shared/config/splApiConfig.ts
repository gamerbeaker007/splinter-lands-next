/**
 * Central Splinterlands endpoint config with a single dev-mode toggle.
 *
 * Set `NEXT_PUBLIC_SPL_DEV_API=true` (in .env) to point every SPL call at the
 * mavs-sl test stack AND prefix every custom_json operation id with `sl-mavs`
 * (the test engine namespaces ops that way, e.g. `sl-mavssm_open_all`). It is a
 * `NEXT_PUBLIC_` flag because both the server (API clients, on-behalf broadcast)
 * and the client (keychain broadcast, the test-mode chip) need it.
 */
export const SPL_DEV_API = process.env.NEXT_PUBLIC_SPL_DEV_API === "true";

export const SPL_API_BASE = SPL_DEV_API
  ? "https://api.mavs-sl.com"
  : "https://api.splinterlands.com";

export const SPL_VAPI_BASE = SPL_DEV_API
  ? "https://vapi.mavs-sl.com"
  : "https://vapi.splinterlands.com";

/** Prepended to every custom_json op id in dev mode; empty in production. */
export const SPL_OP_ID_PREFIX = SPL_DEV_API ? "sl-mavs" : "";
