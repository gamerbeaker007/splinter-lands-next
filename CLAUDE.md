@AGENTS.md

# splinter-lands-next

Next.js 16 (`cacheComponents`) app for Splinterlands land statistics and the Land Manager. Auth via Hive Keychain → SPL JWT. A separate worker process (`src/scripts`, `npm run worker`) fills the DB with region data.

## SPL data access — one path per data type

The data type decides the path, never the call site. Pick the row for any new SPL call; add a row if the data type isn't listed. Per-visitor server calls are what caused SPL rate limits (429) as users grew.

| Data type | Path | Accessor |
| --- | --- | --- |
| Per-player deeds `/land/deeds?player`, staked assets per deed, deed taxes (own deeds), liquidity region/pools, pool positions | Browser (live, ~30-60 s per-player in-tab memo) | `lib/frontend/player-data.ts`, `land-data.ts`, `land-production-data.ts` |
| Balances, inventory, player details, card collection (token only when viewing yourself) | Browser | same loaders → `splBrowser` |
| Stake items / cards (pickers, power cores) | Browser | `land-production-data.ts`, `land-data.ts` |
| JWT reads: production overview, region harvestable + region overview | Browser, token from `splSession` | `land-data.ts` |
| Authorities `/players/authorities` (UI status) | Browser (5 min memo) | `getAuthorityStatus` |
| Card market listings `market_query_by_card` (rental/buy planning) | Browser (live) | `land-production-data.ts` |
| Land pools `/land/liquidity/landpools` (action planning) | Browser (live) | `land-data.ts` `getLandPools` |
| Deed history (projects / reward actions) | Browser | `loadDeedHistory` |
| Tx lookup (polling after broadcast, Today panel, authority polling) | Browser, settled ids recorded per tab | `waitForTransactions` / `lookupTxOutcome` (`settledTxOutcomes.ts`) |
| SPL login `/players/v2/login` | Browser; server verifies once (`establishSessionAction`) | `splLoginInBrowser` |
| Shared data: card details, settings, prices, grouped market, market landing, region/tract deed taxes | Server cache (NodeCache / `"use cache"` when it runs during prerender) | `cardService`, `settingsService`, `tokenService`, `marketService`, `regionService` |
| DB data (region overview, metrics, leaderboards) | Server | `lib/backend/api/internal/*` |
| On-behalf rent/purchase: authorities check, verify-on-throw `confirmSplTrx` | Server (must know the truth before/after signing with the service key) | `splAuthorityService`, `hiveBroadcastService` |
| Support page: DEC/SPS + HIVE/HBD balances, validator votes | Browser | `lib/frontend/support-data.ts` |
| Donation recording (reads the amount off SPL / the Hive chain before a DB write), playground plot import | Server (one-off lookups; the server must verify itself) | `support-actions`, `plot-actions` |
| Worker (`src/scripts`) | Raw server fetch | `spl-land-api` / `spl-base-api` |

- **One implementation, two transports.** Every read that both sides perform lives once in `lib/shared/spl/splReads.ts` (`createSplReads(get)`), pure and browser-safe. The server binds it to axios (`spl-clients.ts` → `splServerReads`, re-exported from `spl-base-api` / `spl-land-api`); the browser binds it to `fetch` (`lib/frontend/spl-browser-api.ts` → `splBrowser`). Never copy a read into either side.
- **Browser reads** go only through `splBrowser`. No server fallback: a visitor who can't reach SPL can't play either, so failures throw into the caller's error state. Browser SPL hosts must be in the CSP `connect-src` (`next.config.ts`); dev mode (`NEXT_PUBLIC_SPL_DEV_API=true`) switches both the base URLs and the CSP to mavs-sl.
- **Move data to the browser by who shares it**, not by call count. Per-player data costs the server O(visitors) → browser. Shared data costs O(1) per TTL → server cache.
- **Pure computation** the browser needs lives in `lib/shared` (no prisma, `logger.server`, `next/headers`, NodeCache). Server actions that mix in DB data take the player's already-fetched SPL data as an argument (small payloads only — never upload a card collection).
- **In-tab cache:** `createBrowserCache(ttl)` (`lib/frontend/browser-cache.ts`), keys start with `<player>:`. After a broadcast call `invalidatePlayerBrowserCaches(player)`; pre-broadcast plan reads pass `force`/`fresh`.
- Endpoint paths come from `lib/shared/config/spl-endpoints.ts` (`SPL_API`, `SPL_VAPI`, `SPL_PRICES_API`) — never hardcode a path.
- **Retry:** server clients share `splRetryConfig()` (`spl-retry.ts`): 8 retries at 5s/10s/20s/30s/1m/2m/4m/8m50s, 503 not retried, `Retry-After` wins. The browser uses the first 3 steps of the same schedule (`lib/shared/spl/splRetrySchedule.ts`).

## Auth

- Login: Keychain signs `${username}${ts}` → browser calls SPL login → `establishSessionAction(username, jwt)` verifies the token upstream once, sets the `jwt_token` cookie and seeds the verification cache (30 min).
- **One token, one place:** the `jwt_token` cookie (`secure`, `sameSite: strict`, deliberately **not** httpOnly). The server reads it in `getAuthStatus`; the browser reads the same cookie (`lib/frontend/splSession.ts`) to set `Authorization: Bearer` on its SPL calls — like the SPL site does. httpOnly would add nothing: the browser needs the token anyway.
- **Trust comes from SPL, not the cookie.** `getAuthStatus` decodes `sub` and has SPL verify the token for that user (forged/unsigned/`alg:none` tokens get 401 — verified live 2026-10-16). Every server action that acts for a player takes the player from `getAuthStatus`, never from the client. Actions that receive a `player` argument (run logs) must call `requirePlayer(player)` (`lib/backend/auth/requirePlayer.ts`).
- A 401 on a browser JWT read clears the cookie and AuthContext logs out. A server session whose cookie JS can't read (old httpOnly cookie) is ended on load so the user logs in once more.
- Residual risk is token *theft* via XSS (not forgery): the CSP (`next.config.ts`) is the defence — keep `connect-src` / `script-src` tight.

## Effects and state (`react-hooks/set-state-in-effect` is enforced)

Never call `setState` synchronously in an effect. Pick the replacement by what the effect did:

- **Load data** → `useAsyncData(key, loader(signal), { errorMessage, keepPreviousData })` (`hooks/useAsyncData.ts`): `key = null` disables, encode every loader input in `key`; derived `loading`, stale responses dropped, `refetch({ silent })`, `mutate(data)`. JWT sections read through the `lib/frontend/land-data.ts` loaders (session from `splSession`); components that need the session itself use `useSplSession`.
- **Reset state when an input changes** → `useSyncedState` / `useDerivedState` (`hooks/useSyncedState.ts`, editable copy of a prop), the handler that changes the input, or adjust state during render.
- **Read localStorage** → `useLocalStorageValue(key)` (`undefined` until hydrated, `null` when unset).

## Conventions

- Run `npm run format:all` (Prettier → `eslint --fix` → `tsc --noEmit`) and `npm run test:node` after changes.
- Import alias `@/` for internal imports.
- Blockchain flows: batch ops (`MAX_OPS_PER_BROADCAST`), verify with SPL op ids (`BroadcastResult.opTxIds`, `<hiveTxId>-N`), never bare Hive ids.
