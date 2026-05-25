# Changelog

All notable changes are documented here.
Format: `## [vX.Y.Z] - YYYY-MM-DD` followed by categorized entries.

> **Historical functionality** (player deed tracking, resource production analytics,
> region overview, planning tools, player efficiency, market insights, card collection)
> is described in separate posts on PeakD. Starting from v1.0.0 all new features and
> changes will also be documented here.

---

## [Unreleased]

---

## [v1.6.0] - 2026-05-25

### Added

#### Land Manager — Renew Rentals

New **Renew Rentals** button in the Bulk Action Panel (alongside Rent Workers).
Renews active worker card rentals that are approaching the end of the season using
Hive Keychain active key (`sm_market_renew_rental`).

- Button enabled when season has < 7 days remaining and the player has active rentals.
- Fetches a fresh card collection on every open to avoid stale renewal state.
- Per-card **extend days** calculated from `next_rental_payment → next_season_end`
  so only the added days are charged (not a full new rental period).
- Cards are skipped when: already renewed (next payment > season end + 2d buffer),
  no `market_id`, or a pending cancellation (`cancel_tx` set).
- Confirm dialog shows per-card breakdown (owner, DEC/day, extend days, total DEC,
  current end, plot) plus balance check before broadcasting.
- Broadcasts in batches of 4 per Hive block limit; waits for on-chain confirmation.

#### Land Manager — Daily harvest fee caps

Per-symbol daily maximum fee enforced account-wide (cumulative across regions, castles, keeps):

| Resource | Daily max fee |
|----------|---------------|
| Grain | 40,000 |
| Wood | 10,000 |
| Stone | 4,000 |
| Iron | 1,000 |

Ratios follow in-game resource values (1 Iron = 40 Grain, 1 Stone = 10 Grain, 1 Wood = 4 Grain).
Caps are applied before every run using today's already-paid fees from the DB. Dry runs reflect the cap.

### Changed

#### Land Manager — SPS fee removed

SPS is no longer subject to the 2% service fee. Only natural resources (Grain, Wood, Stone, Iron)
are charged. This also removes the active-key Keychain prompt that SPS payment previously required —
all fee ops now use the posting key only.

---

## [v1.5.0] - 2026-05-23

### Changed

#### Land Manager — visual improvements

- **Last Claimed / Last Harvest age chip** — dates in the Region Overview and
  Mythic Deeds table now display as a coloured age chip instead of a plain
  timestamp. Colouring follows the 7-day resource-loss cap:
  - < 5 d → green (safe)
  - 5–7 d → yellow (approaching cap)
  - > 7 d → red (past safe window)
  Hours are included in the label (e.g. `3d 14h`) so you can tell exactly how
  close you are to the cap. Extracted into a shared `LastHarvestAgeChip`
  component reused in both tables.
- **Rental — real days remaining** — the *Days left* column in the Rented Cards
  table now shows the time remaining from today instead of the fixed duration
  at the moment of rental. Format follows the same `Xd Yh` pattern; expired
  rentals show *Expired*.
- **Mythic Deeds — Deed UID column removed** — the partial UID column has been
  removed to reduce clutter.
- **Mythic Deeds — History link** — each row now has an external link icon that
  opens the deed's history page on
  [land.spl-stats.com](https://land.spl-stats.com).

---

## [v1.4.0] - 2026-05-21

### Added

#### Land Manager — Rental Authority (server-side renting, required)

**Renting is now server-side only.** The configured land-service account signs
`sm_market_rent` on behalf of every player who has granted it the **Rental**
authority via
[SPL Account Security](https://splinterlands.com/?p=account_security). The
old client-side Keychain rent path has been removed.

- **No more per-batch active-key Keychain popups** during renting. Worker
  staking still uses the player's posting key via Keychain.
- **`RentalAuthorityCard` on the Land Manager page** — shows current state
  (not configured / not authorized / authorized) and broadcasts grant /
  revoke directly via Keychain using `sm_set_authority`:
  - **Grant** → builds `{rental: [...existing, SPL_LAND_SERVICE_ACCOUNT]}`,
    smart-merging with the player's existing rental list so other grants
    (e.g. peakmonsters) are preserved.
  - **Revoke** → builds `{rental: [...existing without service account]}`.
  - After broadcast, the card polls the SPL authorities endpoint for up to
    30 s and shows the confirmed state automatically.
- **Rent / Dry Run buttons are disabled** until the service account is
  configured AND the player has granted the rental authority.
- **`/players/authorities` lookup is cached** for 5 minutes per player.
- **Env vars** (see `.env.example`, both now required for renting):
  - `SPL_LAND_SERVICE_ACCOUNT` — Hive account that signs delegated rent ops.
  - `SPL_LAND_SERVICE_ACTIVE_KEY` — active private key for the above. Server-
    side only — the account name is returned to the UI via a server action
    (`getRentalAuthorityStatus()`); neither value is exposed via
    `NEXT_PUBLIC_*`.
  - `HIVE_RPC_NODES` (optional) — comma-separated RPC endpoints. Defaults to
    `api.hive.blog`, `api.openhive.network`, `api.deathwing.me`.
- **New dependency**: `@hiveio/dhive` for server-side Hive transaction signing.

### Changed

#### docker-compose.yml — security hardening
- **PostgreSQL port restricted to localhost** — `db` port binding changed from
  `5432:5432` (all interfaces) to `127.0.0.1:5432:5432`. Prevents external
  access to the database on internet-facing hosts.
- **Removed weak default fallbacks** — `POSTGRES_USER`, `POSTGRES_PASSWORD`,
  and `POSTGRES_DB` no longer fall back to `postgres`/`postgres`/`spl`. A
  deploy without these set in `.env` now fails immediately rather than
  silently using insecure defaults.
- **`SPL_LAND_SERVICE_ACCOUNT` and `SPL_LAND_SERVICE_ACTIVE_KEY` added to the
  `app` service** — were previously absent from the compose file, meaning the
  rental authority feature was silently unconfigured in Docker deployments.

### Removed

- Client-side Keychain branch of the Rent Empty Workers flow.
- `buildMarketRentOp` in `src/lib/frontend/opBuilders.ts` (no callers remain).
- Earlier admin-page "Rental Authority" section — replaced by the user-facing
  `RentalAuthorityCard` on the Land Manager page.

---

## [v1.3.0] - 2026-05-18

### Added

#### Land Manager — Stake DEC logging
- **`land_stake_dec_log` table** — records per-player, per-day DEC staking activity:
  succeeded and failed amounts (keyed by `region_uid`), totals, error message, and
  transaction IDs. Used to audit automated DEC-stake runs in the land manager.

### Changed

#### Land Manager config
- **`rental_min_foil` field added to `land_manager_config`** — allows configuring a
  minimum foil level for worker rentals (default `0` = any foil). Stored as an integer
  where `0` = regular, `1` = gold, etc.

---

## [v1.2.0] - 2026-05-17

### Changed

#### Land Manager improvements
- **30-second server-side cache for bulk region data** — `getBulkRegionData` now caches
  results per user for 30 seconds. Dry-run calls serve from cache; execute calls always
  bypass it to guarantee fresh data before broadcasting. Eliminates redundant VAPI hits
  when a user clicks around without taking action.
- **Transaction verification persists across panel refreshes** — the Today Panel now
  remembers which transaction IDs have already been verified or failed. Re-fetching the
  activity log (after an action completes) no longer re-looks up already-settled
  transactions against the SPL API.
- **Dry Run dialog simplified** — the raw Operations JSON block and copy button have
  been removed. The dialog now shows only the human-readable plan log, with a larger
  display area.
- **Rent Empty Workers disabled when no eligible plots** — both the Rent and Dry Run
  buttons are automatically disabled when there are no powered plots with empty worker
  slots. The tooltip explains why when disabled. Eligibility re-checks after each
  successful rent run.

---

## [v1.1.0] - 2026-05-16

### Added

#### Land Cards page (Player Overview)
- **New "Land Cards" tab** added to Player Overview (`/player-overview/land-card`).
  The Land Card Resources table — previously embedded at the bottom of the Player
  Dashboard tab — now lives on its own dedicated page for cleaner navigation.

#### Land Manager (new page)

A full land management automation page, accessible to players logged in via Hive Keychain.
Authenticated via HTTP-only JWT cookie — no GitHub OAuth required for this flow.

**Actions**

- **Action 1 — Harvest All** — harvests all harvestable plots across all configured regions
  in one click. Displays per-region harvest results inline.
- **Action 2 — Make Harvestable & Harvest** — for plots that are not yet harvestable,
  automatically resolves the missing resource (transfer from another region, trade, or
  buy with DEC — configurable priority order) and then harvests. Results shown inline.
- **Action 2b — Harvest Castles & Keeps** — separately harvests TAX resource from
  Castle (region-level) and Keep (tract-level) deeds across all enabled regions.
- **Action 3 — Pay Service Fee** — calculates and transfers a configurable percentage of
  harvested resources to a designated fee recipient. Region + tract exemptions are
  supported (default: region 65 / tract 3, own keep exempt). Fee payment is skipped if
  the player is the fee recipient themselves.
- **Action 4 — Distribute Resources** — applies a per-resource strategy to harvested
  amounts (minus service fee): sell for DEC, save, add 100 % to trade hub, or split
  between selling and the hub at a configurable percentage.
- **Action 5 — Rent Workers for Power Core Plots** — finds empty worker slots on
  Power Core plots across enabled regions, selects the best-fit rentals within
  configurable DEC-per-worker and total-budget limits, and submits rental transactions.

**Config dialog**

- Per-account config stored in DB (`land_manager_config` table).
- Configurable fields: enabled regions, Action 2 strategy order, service fee % and
  recipient, fee exemptions (region + tract pairs), Action 4 per-resource strategy,
  hub split %, Action 5 max DEC per worker / min plot PP / total budget cap.

**Region overview panel**

- Displays current resource balances, harvestable status and cost/status per enabled region.

**DB logging**

- Harvest runs, fee payments, make-harvestable steps, mythic harvests and worker rentals
  are all recorded to dedicated log tables for auditability and admin visibility.
- `land_manager_run` table stores a per-run summary (status, actions run, harvested
  totals, fees paid, DEC earned/spent, workers rented).

**Admin page — Fees Received section**

- New `FeesPaidSection` on the admin dashboard shows daily fee totals aggregated across
  all players, with distinct contributor names.
- Amounts displayed are the **received** amount (gross × 0.9) accounting for the 10 %
  Splinterlands resource-transfer fee.

#### Resource page updates
- **Lustrous Potion as AURA price source** — Lustrous Potion (`LUSTROUS`) added as a
  new AURA price source alongside Capacity Flux. Appears in the AURA Price Sources box,
  the resource preset buttons, and the per-AURA unit price calculation.

### Changed
- **Wagon Repair Kit crafting costs updated** — costs revised to:
  AURA 1,250 · Wood 17,500 · Stone 7,000 · Iron 1,750.
  Updated in the resource conversion calculator preset, the player crafting overview, and
  the AURA-per-unit price derivation.

### Fixes
- **GFA multiplier** — For the planner the GFA is reduced from 5 to 1.

---

## [v1.0.1] - 2026-05-09

### Fixes

- **Worker container missing env vars** — the `worker` service in `docker-compose.yml`
  was not passed `CACHE_INVALIDATE_TOKEN` or `NEXT_PUBLIC_BASE_URL`. As a result the
  post-job cache-refresh HTTP call was silently skipped after every nightly run,
  leaving the in-memory cache in the `app` container stale until the next page cold-load.
  Both variables are now forwarded to the worker:
  - `NEXT_PUBLIC_BASE_URL: http://app:3000` — uses the Docker Compose service name so
    the worker can reach the app within the internal Docker network.
  - `CACHE_INVALIDATE_TOKEN: ${CACHE_INVALIDATE_TOKEN:-}` — passes the token through
    from the `.env` file (already required by the `app` service).


---

## [v1.0.0] - 2026-05-08

### Summary

First versioned release. Establishes the production infrastructure: multi-stage
Docker image with standalone Next.js output, a dedicated long-running worker
process, DB-based structured logging, and an admin dashboard with live job status
and manual trigger support.

### Added

#### Docker Infrastructure

- **Multi-stage Dockerfile** (`base → builder → runner`) replacing the previous
  single-stage build. The runner image contains only production artefacts —
  standalone Next.js output, worker source, and globally pinned CLI tools
  (`prisma`, `tsx`, `dotenv`). Significantly smaller final image.
- **Non-root user** (`nextjs:nodejs`) in the runner stage for improved container
  security.
- **Reproducible builds** — switched from `npm install` to `npm ci`.
- **Dummy `DATABASE_URL` build arg** — `prisma generate` no longer requires a
  real database at build time; the ARG is scoped to the builder stage only.
- **`APP_VERSION` build arg** — version string is baked into the image at CI
  build time and exposed as `process.env.APP_VERSION` at runtime.
- **Separate service containers** in `docker-compose.yml`:
  - `migrate` — one-shot init container that runs `prisma migrate deploy` before
    `app` and `worker` start. Exits with code 0 on success; restarts are disabled.
  - `worker` — long-running process running the background data pipeline.
  - `app` — the Next.js web application.
- **`docker-entrypoint.sh`** — updated to `exec node server.js` (standalone output).
- **`docker-entrypoint-worker.sh`** — updated with explicit `--tsconfig` flag.

#### Worker Process (`src/scripts/worker.ts`)

- Long-running Node.js process with two independent schedule loops:
  - **Daily loop** — triggers at 01:00 AM local time.
  - **Weekly loop** — triggers on Sunday at 02:00 AM local time.
- **Graceful shutdown** (`src/scripts/lib/graceful-shutdown.ts`) — handles
  `SIGTERM`/`SIGINT` with `interruptibleSleep` so containers stop cleanly.
- **Stale run recovery** — on startup, any `WorkerRun` records stuck in
  `running` status are marked `failed` (handles unclean restarts).

#### DB-Based Logging

- **Removed Winston** — no more file-system log files or the `winston` dependency.
- **`Log` Prisma model** — structured logs are written to the `logs` DB table with
  `level`, `message`, `meta` (JSON), and `created_at`.
- **`logger.server.ts`** rewritten — console output in development + fire-and-forget
  DB write. Exports `logger.info/warn/error(message, meta?)` and `logError(ctx, err)`.
- **Log pruning** — daily job prunes log entries older than 5 days.

#### Job Tracking

- **`WorkerRun` Prisma model** — records `job_type`, `status`
  (`running`/`completed`/`failed`), `started_at`, `finished_at`, `duration_ms`,
  and optional `error` per run.
- **Worker run pruning** — daily job prunes `WorkerRun` records older than 30 days.
- **`dataJobs.ts`** shared service — `runDailyJob()`, `runWeeklyJob()`, and
  `runJobWithTracking()` are shared between the worker process and the admin
  manual-trigger action; no duplicate pipeline logic.

#### Admin Dashboard

- **Worker Status section** — shows last run details (status chip, started,
  finished, duration, error) for the daily and weekly jobs.
- **"Run now" buttons** — manually trigger a daily or weekly job from the admin
  UI. Guards against duplicate runs (blocked if a run is already `running`).
  Uses `setImmediate` for fire-and-forget execution so the HTTP response is
  immediate.
- **Auto-polling** — the Worker Status section polls `getWorkerRunStatus()` every
  5 seconds while any job is in `running` state.
- **DB-backed log viewer** rewritten — paginated log table with level filter and
  text search. Replaces the previous file-system log reader.
- **Version display** — admin page shows the `APP_VERSION` baked in at build time.

#### CI/CD

- **`ci.yml`** — builds and pushes `gamerbeaker/splinter-lands-next:latest` on
  every push to `main`; build-only check on pull requests.
- **`release.yml`** — triggered by `v*` tags. Builds and pushes a versioned Docker
  image, extracts the changelog entry for that version, and creates a GitHub
  Release with full setup instructions.
- **`.env.example`** — documents all required environment variables.
