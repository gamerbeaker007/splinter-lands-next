# LandManager Feature — Planning & Context

> Load this file for context whenever working on the `LandManager` branch.

---

## Overview

A new **Land Manager** page that lets an authenticated player run automated land management actions against their Splinterlands regions using their personal JWT token.

### Goals (phased)
1. **Phase 1 — Manual control**: Individual action buttons per action, result visible on page, full control.
2. **Phase 2 — One-click automation**: Single "Run All" button that executes all configured actions in sequence.
3. **Phase 3 — Worker process**: Once Splinterlands supports account delegation, run as background worker without player session.

---

## Authentication & JWT

- Player must be signed in via **Hive Keychain** (the existing app-level login, not GitHub OAuth).
- GitHub OAuth is only used for the admin page — it is unrelated to the Land Manager.
- Login flow: Keychain signs a challenge → `splLogin()` VAPI call → returns JWT → stored in an **HTTP-only cookie** (`jwt_token`).
- Server Actions read the JWT directly from the cookie via `cookies()` — **no DB storage needed**.
- All VAPI action calls use: `Authorization: Bearer {jwt_token}` header, where the token is read from the cookie server-side.
- Existing validation: `src/lib/backend/jwt/splJwtValidation.ts` (decodes + checks exp/nbf).
- Existing auth actions: `src/lib/backend/actions/auth-actions.ts` (`getAuthStatus`, `loginAction`).
- The Land Manager page checks `getAuthStatus()` and redirects/blocks if not authenticated.
- No "Set JWT Token" flow needed in config — player just needs to be logged in via Keychain.

---

## Page Structure — `src/app/land-manager/page.tsx`

```
┌─────────────────────────────────────────────────────┐
│  Land Manager                      [Config ⚙]       │
├─────────────────────────────────────────────────────┤
│  Region Overview (enabled regions only)              │
│  ┌──────┬──────────┬───────────┬──────────────────┐ │
│  │Region│Resources │Harvestable│Cost / Status      │ │
│  └──────┴──────────┴───────────┴──────────────────┘ │
├─────────────────────────────────────────────────────┤
│  Actions                                             │
│  [Action 1: Harvest All]   → result inline           │
│  [Action 2: Make Harvestable & Harvest] → result     │
│  [Action 2b: Harvest Castles & Keeps] → result       │
│  [Action 3: Pay Service Fee] → result                │
│  [Action 4: Distribute Resources] → result           │
│  [Action 5: Rent Workers]  → result                  │
│  [▶ Run All]                                         │
├─────────────────────────────────────────────────────┤
│  Run History (last N runs, summary level)            │
└─────────────────────────────────────────────────────┘
```

---

## Config (Global Per Account)

Stored in DB table `land_manager_config`. One row per player.

| Field | Type | Notes |
|---|---|---|
| `player` | String PK | account name |
| `enabled_regions` | Int[] | region numbers to include in actions |
| `action2_strategy` | Json | priority order: `["transfer", "trade_resources", "buy_dec"]` |
| `service_fee_pct` | Float | default `5.0` (% of harvested resource) |
| `service_fee_recipient` | String | default `"beaker007"` |
| `fee_exemptions` | Json | `[{ region_id: int, tract_id: int }]` — no fee for these |
| `action4_strategy` | Json | per resource: `{ "GRAIN": "sell_dec", "WOOD": "trade_hub", "STONE": "save", ... }` |
| `action4_split_pct_hub` | Float | % to add to trade hub when strategy is `"split_trade_hub"` (e.g. 50) |
| `action5_max_dec_per_worker` | Float | max DEC to spend renting one worker |
| `action5_min_plot_pp` | Float | only rent for plots with PP >= this threshold |
| `action5_max_total_dec` | Float | budget cap per run across all worker rentals |

### Action 4 Strategy Options (per resource)
- `sell_dec` — sell resource for DEC immediately
- `save` — keep in balance, do nothing
- `trade_hub` — add 100% to trade hub
- `split_trade_hub` — sell `(100 - action4_split_pct_hub)%` for DEC, add rest to hub

### Action 2 Strategy Priority (configurable order)
1. `transfer` — move resource from another owned region
2. `trade_resources` — trade one resource for another (e.g. GRAIN ↔ WOOD)
3. `buy_dec` — buy missing resource with DEC from trade hub/market

---

## Fee Exemptions (Action 3)

Player pays **no service fee** if any of these apply:
- Player **is** the service fee recipient (e.g. they are `beaker007`)
- The region+tract combo is in `fee_exemptions` (default: region 65 / tract 3)

Fee exemptions are stored in config as a JSON array; region 65 / tract 3 is seeded as the default.

---

## Actions — Detail

### Action 1 — Harvest All
- For each enabled region: if harvestable, call harvest API.
- Result: list of harvests (region, resource, amount received).

### Action 2 — Make Harvestable & Harvest
- For each enabled region that is NOT harvestable:
  - Check what resource is missing/insufficient.
  - Apply configured strategy (in priority order) to obtain the resource.
  - Then harvest.
- Result: what was transferred/traded/bought, what was harvested.

### Action 2b — Harvest Castles & Keeps
- For each enabled region: find all deeds with `worksite_type === "CASTLE"` (region-level) or `worksite_type === "KEEP"` (tract-level).
- If harvestable, call the harvest API for each.
- Runs **after Action 2** (making plots harvestable first has no bearing on castles/keeps, but sequencing keeps all harvesting grouped).
- TAX resource harvested here follows the same Action 3 fee logic and Action 4 distribution as other resources.
- Result: list of castle/keep harvests (deed_uid, type, TAX amount received).

### Action 3 — Pay Service Fee
- For each harvested region (this run), calculate `amount × service_fee_pct / 100` per resource.
- Skip if fee exemption applies.
- Transfer that amount to `service_fee_recipient`.
- Result: per-region fee amounts transferred.

### Action 4 — Distribute Harvested Resources
- For each resource harvested (minus fee already paid in Action 3), apply `action4_strategy` per resource.
- Result: amounts sold / saved / added to hub.

### Action 5 — Rent Workers for Power Core Plots
- Find all enabled-region plots that: have a power core staked AND are below max workers.
- For each such plot, find the best-fit worker cards available for rent (considering plot biome/bonuses).
- Only rent if: price ≤ `action5_max_dec_per_worker` AND plot PP ≥ `action5_min_plot_pp`.
- Stop when cumulative spend reaches `action5_max_total_dec`.
- Result: which plots got workers, cost per worker.

---

## Run Results (DB)

Stored in `land_manager_run` table. Summary level per run.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) PK | |
| `player` | String | |
| `started_at` | DateTime | |
| `finished_at` | DateTime? | |
| `status` | String | `"running" \| "completed" \| "partial" \| "failed"` |
| `actions_run` | String[] | which actions executed |
| `summary` | Json | `{ harvested: {GRAIN: 100, WOOD: 50, TAX: 20, ...}, fees_paid: {...}, dec_earned: 0, hub_added: {...}, workers_rented: 0, dec_spent_renting: 0 }` |
| `error` | String? | top-level error if failed |

---

## VAPI Endpoints

Base URL: `https://vapi.splinterlands.com`

### Already Known (GET — existing)
- `GET /land/deeds?player={player}` — owned deeds
- `GET /land/resources/production/region/harvestable` — harvestable check
- `GET /land/resources/owned` — current resource balances
- `GET /land/resources/rewardactions/{deedUID}` — harvest history

### To Discover Per Action (POST — action endpoints)
Investigate via https://vapi.splinterlands.com/swagger/ as each action is implemented:
- `POST /land/resources/harvest` (or similar) — harvest action
- `POST /land/resources/transfer` — transfer between regions
- `POST /land/resources/trade` — trade one resource for another
- `POST /land/resources/sell` — sell for DEC
- `POST /land/liquidity/add` — add to trade hub
- Worker rental endpoints via `delegation-rental-v3`

Auth header for all action calls: `Authorization: Bearer {jwt_token}`

---

## File Layout

```
src/
  app/land-manager/
    page.tsx                          # Server component, requires session
  components/land-manager/
    LandManagerPage.tsx               # Main client component
    ConfigDialog.tsx                  # MUI Dialog for config
    RegionOverview.tsx                # Region status table
    ActionPanel.tsx                   # Action buttons + inline results
    RunHistory.tsx                    # Past run summaries
  lib/backend/
    actions/land-manager/
      config-actions.ts               # Get/set player config
      harvest-actions.ts              # Action 1, 2 & 2b (castles/keeps)
      fee-actions.ts                  # Action 3
      distribute-actions.ts           # Action 4
      worker-actions.ts               # Action 5
      run-actions.ts                  # Save/fetch run records
    services/
      landManagerService.ts           # Orchestration + caching
    api/spl/
      spl-land-action-api.ts          # VAPI POST calls (JWT auth)
  types/
    landManager.ts                    # Config, run, result types
prisma/
  migrations/
    20260510000000_add_land_manager/  # Single migration file (evolving)
```

---

## DB Migration Strategy

- All Land Manager schema changes go in **one migration file** during development.
- Reset DB freely: `npx prisma migrate reset` is fine.
- When feature is production-ready, clean up and finalize the migration.
- Migration name: `add_land_manager`

---

## Security Notes

- JWT is **never stored in the DB** — read from the HTTP-only `jwt_token` cookie server-side.
- Never log or return the raw JWT to the frontend.
- Service fee recipient and exemptions validated server-side; never trust client input.
- All VAPI calls made server-side only (Server Actions).

---

## Implementation Status (May 2026)

### ✅ Completed

| Item | Notes |
|---|---|
| Auth / JWT / Hive Keychain login | HTTP-only cookie, `getAuthStatus()` |
| Config dialog | enabled_regions, strategies, fee_accepted, post_harvest_strategy, excluded_resources, mythic_fee_accepted |
| Region Overview table | Live harvestable/status per enabled region |
| RegionResourceSummary | Live resource balances, refreshes after operations via `refreshKey` |
| **Action 1: Harvest All** | `useHarvestAllAction`, `HarvestAllRow`, fee payment integrated, `HarvestConfirmDialog` |
| **Action 2: Make Harvestable** | `useMakeHarvestableAction`, `MakeHarvestableRow`, transfer/swap/buy_dec strategies |
| **Action 2b: Harvest Mythics** | `useHarvestMythicsAction`, `HarvestMythicsRow`, `MythicConfirmDialog`, fee payment |
| **Action 3: Pay Service Fee** | Integrated into Harvest and MythicHarvest flows (not standalone button) |
| **Action 4: Process Resources** | `useProcessResourcesAction`, `ProcessResourcesRow`, accumulate/sell_for_dec/add_to_pool strategies. add_to_pool: two-phase sell→re-fetch→add_liquidity with exact spot price |
| Today Panel | Daily activity log with tx verification (harvest, make-harvestable, mythics, post-harvest) |
| DB schema | LandManagerConfig, LandHarvestLog, LandMakeHarvestableLog, LandPostHarvestLog, LandMythicHarvestLog |
| Dry Run dialog | Shows planned ops/log before broadcast |
| Experimental feature warning | Alert in LandManagerPage |

### ❌ Not Yet Implemented

| Item | Notes |
|---|---|
| **Action 5: Rent Workers** | No hook, no row, no action file. Needs worker selection algorithm (biome/bloodline scoring), budget caps, VAPI endpoints |
| Run History panel | No `RunHistory` component, no `land_manager_run` DB table (individual day-level log tables exist instead) |
| "Run All" one-click button | Phase 2 feature |

### Architecture Divergences From Original Plan

- `ActionPanel.tsx` → became `BulkActionPanel.tsx` with separate `*Row.tsx` files per action
- Action 3 (pay fee) is integrated into harvest flows, not a standalone button
- `land_manager_run` table was not created; instead, granular per-action log tables (`land_*_log`) are used for the Today Panel

### Known Issues / Open Items

- [ ] Fee exemption logic: currently checks `shouldApplyFee(username, regionNumber)` but the exemption is `{region_id, tract_id}` — if in region 65 AND tract 3 only, fee should be skipped. Current logic may skip the whole region instead.
- [ ] Harvest fee acknowledgment ("I acknowledge the fee" checkbox): `fee_accepted` is stored in config but the UX for "don't show this again" after accepting is TBD.
- [ ] Action 5: exact VAPI worker rental endpoints (check swagger)
- [ ] Action 5: worker selection algorithm (biome, bloodline, ability scoring)
- [ ] Rate limiting / throttling for bulk VAPI calls at scale

---

## Open Questions / TBD

- [ ] Action 5: exact VAPI POST endpoints for worker rental (discover when implementing)
- [ ] Action 5: worker scoring algorithm details
- [ ] Whether "transfer between regions" (Action 2 strategy) is same-account only — currently assumed yes
