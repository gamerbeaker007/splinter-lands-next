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

## [v1.10.0] - 2026-06-03

### Fixed

#### Land Manager — Feed workers button now appears once a build is finished

A worksite that had finished construction but not yet been fed showed no actions at all — the Feed workers button never appeared.

- Splinterlands keeps `is_construction === true` even after a build completes; it only flips to `false` once the workers are fed. The tab treated that flag alone as "still building", so a finished plot stayed greyed out forever.
- Construction is now considered finished once its `projected_end` has passed. A finished-but-unfed plot still shows its progress bar (at 100% / `0m` left) with the worksite-change icons disabled, and now also surfaces the **Feed workers** button (and **Fix grain deficit** when the region is short on grain).

### Added

#### Land Manager — Fix grain deficit (cover worker food from other regions)

When a ready worksite's region doesn't hold enough grain to feed its workers, a per-plot **Fix grain deficit** button now proposes a plan to bring grain in from your other regions.

- Uses your configured Make-Harvestable strategy order — **transfer** surplus grain from another region, else **swap** a surplus resource into grain, else **buy** grain with DEC — to cover exactly the worker food requirement, while reserving each donor region's own harvest needs.
- Opens a confirm dialog showing the proposed operations and whether they fully cover the shortfall (confirm is disabled if they can't). It only moves grain — once it lands, use the **Feed workers** button to activate the worksite.
- The grain moves are broadcast and recorded in the make-harvestable log — they show in the **Today** panel under **Make Harvestable** (the panel now refreshes after worksite actions), mirroring the **Make All Harvestable** flow.

---

## [v1.9.0] - 2026-06-02

### Fixed

#### Land Manager — DEC stake shortfall judged from the global pool

The DEC stake alert no longer reports a false shortfall while a building is in progress.

- A region's `dark_energy_staked` can temporarily read `0` during construction even though that DEC is still staked in the account-wide `dark_energy` pool. The alert previously summed per-region gaps and flagged a shortfall that did not exist.
- Sufficiency is now decided from the global pool: `total_dec_staked` vs the sum of `dark_energy_required` across **all** regions.
- The **Stake DEC** action only stakes the genuine global shortfall (`max(0, totalRequired − totalStaked)`), so it no longer offers to over-stake during construction.

#### Terrain boost — dual-element cards use their best element

Cards with a secondary color now receive the terrain boost from whichever of their two elements the terrain favours most (or penalises least), matching how Splinterlands applies it.

- A new shared `bestTerrainBonusPct(terrain, element, secondaryElement)` helper picks the best of the primary and secondary element modifiers; the previous per-element `terrainBonusPct` is now centralized (removing duplicate copies in the planner calcs and the element selector).
- Applied wherever the boost was computed ourselves: the **Terrain boost alerts** (negative / zero), the **planner**, and the **playground** worker slots.
- Fixed a latent bug where a card's `subElement` defaulted to `red`/fire when it had no secondary color — single-color cards would otherwise have picked up a phantom fire terrain boost.
- Card tiles continue to show the boost reported directly by the Splinterlands API.

### Added

#### Land Manager — Feed workers (activate a ready worksite)

When a worksite finishes construction it shows as *"Worksite Ready …"* and must be activated by feeding its workers grain. The Worksites tab now has a per-plot **Feed workers** button for this.

- Shown only on ready worksites. A confirm dialog states the grain cost (the plot's `grain_required`) and the grain currently held in the region.
- Disabled when the region doesn't hold enough grain to cover the cost (tooltip shows have / need); `auto_buy_grain` stays off so it never buys grain.
- Broadcasts the `update_worksite` Hive op via Keychain (posting key) and verifies the transaction, then refreshes the tab — mirroring the existing build / cancel-construction flow.

#### Land Manager — Over-staked DEC alert

When more DEC is staked than required across your regions, the Alerts panel now shows an informational note with the excess amount and how much you could safely unstake. Both the over-staked and shortfall alerts list the specific regions involved (in use / needed / over-by or shortfall per region).

#### Land Manager — Rental batch size + UX improvements

Rental workers can now be rented in configurable batches so the market is re-evaluated between runs, giving better matches when many plots need workers at once.

- **Batch size picker** (10 / 20 / 50 / 100 / All) added to the Rental section of the Config dialog. Default is **10**. *All* means no limit. Smaller batches lower the chance of stale market data affecting later matches.
- An info note in the config explains that larger batches carry a higher risk of suboptimal matches because market conditions are not re-checked mid-batch.
- The rent action button is now a single **Find Rental Workers / for empty slots on plot** button (dry-run button removed). A confirm dialog is shown before any rentals are broadcast, so a separate dry-run step is not needed.
- Active rental config (batch size, DEC caps, PP floor, foil minimum) is shown as chips next to the action button so the current settings are always visible without opening the dialog.
- **DEC Actions** is now a dedicated tab in the Land Manager (previously the Stake DEC row lived inside the Rental tab). The tab order is: Harvest → Rental → DEC Actions → Worksites.
- `rental_batch_size` column added to `land_manager_config` (nullable `INT`, default `10`); existing rows get the default on migration.

#### Splinterlands API — 503 no longer retried

All three SPL API clients (`spl-base-api`, `spl-land-api`, `spl-prices-api`) previously retried any 5xx response up to 10 times with exponential back-off. A **503 Service Unavailable** response is now treated as a hard failure: it propagates immediately as an error instead of burning retries and flooding logs. All other 5xx codes and 429 (rate-limit) continue to be retried.

---

## [v1.8.0] - 2026-05-31

### Added

#### Land Manager — Worksites tab

A new **Worksites** tab in the Land Manager lets you browse and switch worksites across all your plots.

- **List view / Grouped-by-region view** — toggle between a flat list and accordion-style region groups.
- **Live data** — always fetches fresh data from the Splinterlands API (no cache).
- **Land filter** — the same filter drawer used in Region Overview (regions, tracts, plots, rarity, deed type, plot status, resource, worksite, PP ranges) is available on the right side. The player filter is omitted since the tab always shows the signed-in player's plots.
- **Per-plot worksite card** — each card shows:
  - Plot reference (region/tract/plot), rarity, terrain type, plot status, and magic type.
  - Current worksite icon + name, and a *Developed* badge when fully operational.
  - **Under construction** section: progress bar with time remaining and what is being built. A **Cancel construction** button triggers the `cancel_construction` Hive op via Keychain.
  - **Switch worksite** buttons — only terrains that are valid for the plot's deed type are shown (`allowedTerrainsByWorksite`). Worksites that receive a production bonus for the plot's status (`deedResourceBoostRules`) are highlighted with a ⭐ badge.
- **Broadcast via Keychain** — both construction and cancel ops use the player's posting key through Hive Keychain, consistent with the harvest flow.
- New constants added to `primitives.ts`: `worksiteConstructionOpName` (op → Hive custom_json id) and `worksiteSelectIconMap` (picker button images).
- New select-icon URLs added to `statics_icon_urls.ts` (`land_worksite_select_*`).
- New op builders in `opBuilders.ts`: `buildWorksiteConstructionOp`, `buildCancelConstructionOp`.

## [v1.7.1] - 2026-05-30

### Added

#### Land Manager — Swap profitability analysis in Region Overview

A new **Swap Analysis** column in the Region Overview table highlights when it would be more profitable to swap GRAIN via the AMM than to harvest a natural resource (WOOD, STONE, IRON) directly.

- For each harvestable non-GRAIN resource, computes the two-hop AMM swap (GRAIN → DEC → resource) using live pool data and compares the output to the harvestable amount.
- When swapping yields more, a warning icon labelled with the resource symbol is shown. Hovering reveals a tooltip, e.g. *"Harvest IRON: 600 (consumes 10 000 GRAIN) | Swap 10 000 GRAIN → 800 IRON (swap is better)"*.
- A ✓ indicator is shown when all resources are profitable to harvest.
- A new **Open harvest page** icon button in the Action column links directly to the region's harvest page on Splinterlands (`/land/praetoria/{region}/production/claim`).

---

## [v1.7.0] - 2026-05-29

### Changed

#### Land Manager — Post-harvest strategy: configurable sell/pool split

The three previous strategies (`accumulate`, `sell_for_dec`, `add_to_pool`) are consolidated
into two: **Accumulate** and **Sell & Pool**.

**Sell & Pool** lets you set independent percentages for selling resources to DEC and adding
resources to the liquidity pool (DEC comes from your wallet). The remainder is accumulated.

- Two sliders in Config dialog (5 % step, 0–100 % each).
- Phase 1: sell ops; Phase 2: add-liquidity ops with re-fetched prices.
- **DEC balance protection**: pool amounts are scaled down proportionally when wallet DEC
  (plus sell proceeds) would be insufficient. Warning shown with a split-adjustment tip.
- Dry run reports estimated DEC needed, current balance, and expected sell proceeds.

#### Land Manager — Service fee replaced with per-player donation config

The hardcoded 2 % app-level service fee and server-side exemption list (`FEE_EXEMPT_USERS`,
`FEE_EXEMPT_REGIONS`) have been removed. Donation participation is now fully opt-out and
configurable per player.

- **Donation Config** section in the Config dialog: toggle on/off, set percentage (default 2 %),
  and set per-symbol daily caps (default: GRAIN 40 000 / WOOD 10 000 / STONE 4 000 / IRON 1 000).
- Donation recipient (`beaker007`) and region remain the defaults but the transfer op now
  accepts `toPlayer` dynamically, making future multi-recipient support straightforward.
- The `HarvestConfirmDialog` and `MythicConfirmDialog` (one-time fee-acceptance flows) are removed.
- Admin page: `FeesPaidSection` replaced by `DonationsMadeSection` (shows received amounts after
  the 10 % Splinterlands transport fee).
- Harvest log DB columns renamed: `fees_json → donations_json`, `fee_transactions → donation_transactions`, etc.

### Added

- `donation_enabled`, `donation_pct`, `donation_daily_caps_json` columns on `land_manager_config`.
- `post_harvest_sell_pct`, `post_harvest_pool_pct` columns on `land_manager_config`.
- `saveDonationConfig` server action for persisting donation settings.
- `usePayDonations` hook encapsulating the full donation broadcast + logging flow.
- `DonationsMadeSection` admin component (daily totals table, shows net received amount).
- Warning alert in Process Resources row when pool amounts are scaled down due to low DEC.

### Removed

- `feeExemptionService` and `FEE_EXEMPT_USERS` / `FEE_EXEMPT_REGIONS` env vars.
- `acknowledgeHarvest` / `saveMythicFeeAccepted` server actions.
- `fee_accepted`, `mythic_fee_accepted` columns from `land_manager_config`.
- Unused and dead code (cleanup)

---

## [v1.6.0] - 2026-05-25

### Added

#### Land Manager — Harvest/Rental tabs + Power Core staking

Land Manager now uses two dedicated views:

- **Harvest** tab: bulk harvest operations, alerts, mythic overview, and per-region status.
- **Rental** tab: rental authority status, rental bulk actions, and rental plot overview.

Both tabs share a common top section (config access, Region Resource Summary, and Today panel).

Unpowered plots in Rental Overview now include a **Stake Power Core** action:

- Loads available Power Core inventory from unauthenticated VAPI stake-item endpoints.
- Fetches grouped count and paginated available IDs for `STK-LND-PCR`.
- Broadcasts `sm_stake_change` using Hive Keychain **posting key**.
- Waits for on-chain transaction confirmation before refreshing rental data.

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

#### Maintenance Mode

- **Auth**: login dialog shows a dedicated maintenance warning banner instead of a generic error when the SPL API is under maintenance.

#### Land Manager — SPS fee removed

SPS is no longer subject to the 2% service fee. Only natural resources (Grain, Wood, Stone, Iron)
are charged. This also removes the active-key Keychain prompt that SPS payment previously required —
all fee ops now use the posting key only.


### Land Manager — Rent Workers dialogs
- Paginated table (20 rows/page) for Dry-Run and Confirm dialogs; extracted shared `RentalPlotTable` component with per-dialog column definitions.


### Fixed

- **Land Manager — Rent Workers**: `waitForTransactions` polling now uses `pLimit(5)` to avoid concurrent `lookupTransaction` floods on large transaction sets.
- **Land Manager – Rent Workers**: DEC balance check
- **Land Manager – Rent Overview**: Add pagination for PlotTable(s)
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
