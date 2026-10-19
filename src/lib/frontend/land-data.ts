"use client";

import { getAuthorityServiceInfo } from "@/lib/backend/actions/land-manager/authority-actions";
import {
  createBrowserCache,
  invalidatePlayerBrowserCaches,
} from "@/lib/frontend/browser-cache";
import { formatError } from "@/lib/frontend/errorFormat";
import { splBrowser } from "@/lib/frontend/spl-browser-api";
import { getSplSession } from "@/lib/frontend/splSession";
import { mapRegionDataToDeedComplete } from "@/lib/shared/deedMapping";
import {
  authorityListsOf,
  hasAuthority,
  type PlayerAuthorityLists,
} from "@/lib/shared/playerAuthorities";
import { regionBalanceFrom } from "@/lib/shared/spl/splReads";
import type { DeedComplete } from "@/types/deed";
import type { MythicDeed } from "@/types/landManager";
import type {
  SplHarvestableResource,
  SplProductionOverviewRegion,
  SplRegionOverviewData,
} from "@/types/spl/landManager";
import type { SplLandPool, SplPlayerPoolPosition } from "@/types/spl/landPools";

/**
 * The land manager's per-player SPL reads, run in the visitor's browser
 * (see CLAUDE.md). Names and result shapes mirror the server actions they
 * replaced, so the action flows only swapped their import.
 *
 * The player is always the logged-in one (the session store); JWT reads use
 * its token. Short-lived per-player memos (keyed `<player>:...`) dedupe the
 * panels that mount together; `force` skips them for pre-broadcast plan
 * reads, and `invalidatePlayerRegionCaches` drops them after a broadcast.
 */

// Long enough to survive a Harvest ↔ Production switch after the shell warmed
// the other page (see LandManagerProvider); actions and Refresh invalidate it.
const BULK_REGION_TTL_MS = 60_000;
const MYTHIC_DEEDS_TTL_MS = 60_000;
const POOL_POSITION_TTL_MS = 30_000;
const AUTHORITY_TTL_MS = 5 * 60_000;

const NOT_AUTHENTICATED = "Not authenticated";

/**
 * Drop every memoised region/liquidity snapshot for the signed-in player.
 *
 * Call this after an on-chain action that moves resources, DEC or liquidity, and
 * BEFORE triggering a UI refresh — otherwise panels reading without `force`
 * (RegionResourceSummary, the pool-buffer alert) can win a memo hit on a
 * snapshot taken while the plan was being built, i.e. pre-action balances.
 */
export async function invalidatePlayerRegionCaches(): Promise<void> {
  const session = getSplSession();
  if (session) invalidatePlayerBrowserCaches(session.username);
}

/** `cached`, or a fresh load that replaces the memo when `force` is set. */
function memo<T>(
  cache: ReturnType<typeof createBrowserCache<T>>,
  key: string,
  force: boolean,
  load: () => Promise<T>
): Promise<T> {
  // Keys end in "|" so invalidating one never prefix-matches a longer key.
  if (force) cache.invalidate(key);
  return cache(key, load);
}

// ── Production overview ───────────────────────────────────────────────────

export async function getProductionOverview(): Promise<{
  regions: SplProductionOverviewRegion[];
  totalDecStaked: number;
  error?: string;
}> {
  const session = getSplSession();
  if (!session)
    return { regions: [], totalDecStaked: 0, error: NOT_AUTHENTICATED };
  try {
    return await splBrowser.fetchProductionOverview(
      session.username,
      session.token
    );
  } catch (error) {
    return { regions: [], totalDecStaked: 0, error: formatError(error) };
  }
}

// ── Bulk region data (harvestable + balance for multiple regions) ──────────

export interface BulkRegionData {
  harvestable: Record<string, SplHarvestableResource[]>;
  balances: Record<string, Record<string, number>>;
  /**
   * region_uid → the raw production overview. Carries the per-plot worksite rows
   * and the region's `resource_recipes`, which is what consumption RATES are
   * derived from (see `regionConsumptionPerHour`). It comes from the same
   * response as `balances`, so exposing it costs no extra request.
   */
  overviews: Record<string, SplRegionOverviewData>;
  /**
   * region_uid → why that region's harvestable list could not be fetched.
   * The fan-out below is per region, so one failing region must not blank out
   * the others; callers render this next to the region it belongs to instead of
   * silently showing it as "nothing to harvest".
   */
  errors: Record<string, string>;
  /** Set only when the whole call failed before any region was attempted. */
  error?: string;
}

/**
 * Per-region memos for the fan-out, one per endpoint. Several panels ask for
 * overlapping region sets at the same moment — the harvest table and summary
 * (enabled regions), the worksite alerts (every region with a deed) — so the
 * memo is keyed per region, not per set: an overlap shares one request (also
 * while in flight), and the 30s TTL covers re-mounts. A failed harvestable
 * read is not memoised; a failed overview resolves to null (all-zero balance).
 */
const harvestableCache =
  createBrowserCache<SplHarvestableResource[]>(BULK_REGION_TTL_MS);
const regionOverviewCache = createBrowserCache<SplRegionOverviewData | null>(
  BULK_REGION_TTL_MS
);

function regionOverview(
  player: string,
  token: string,
  uid: string,
  force: boolean
): Promise<SplRegionOverviewData | null> {
  return memo(
    regionOverviewCache,
    `${player}:region-overview:${uid}|`,
    force,
    () => splBrowser.fetchRegionOverview(player, uid, token)
  );
}

export async function getBulkRegionData(
  regionUids: string[],
  force = false
): Promise<BulkRegionData> {
  const session = getSplSession();
  if (!session) {
    return {
      harvestable: {},
      balances: {},
      overviews: {},
      errors: {},
      error: NOT_AUTHENTICATED,
    };
  }
  const { username: player, token } = session;

  const results = await Promise.all(
    regionUids.map(async (uid) => {
      const [harvestableResult, overview] = await Promise.all([
        memo(harvestableCache, `${player}:harvestable:${uid}|`, force, () =>
          splBrowser.fetchSplHarvestableResources(player, uid, token)
        )
          .then((data) => ({ data, error: null as string | null }))
          .catch((err: unknown) => ({
            data: null,
            error: formatError(err),
          })),
        regionOverview(player, token, uid, force),
      ]);
      return { uid, harvestableResult, overview };
    })
  );

  const harvestable: Record<string, SplHarvestableResource[]> = {};
  const balances: Record<string, Record<string, number>> = {};
  const overviews: Record<string, SplRegionOverviewData> = {};
  const errors: Record<string, string> = {};

  for (const { uid, harvestableResult, overview } of results) {
    if (harvestableResult.error) errors[uid] = harvestableResult.error;
    else harvestable[uid] = harvestableResult.data ?? [];
    balances[uid] = regionBalanceFrom(overview);
    if (overview) overviews[uid] = overview;
  }

  return { harvestable, balances, overviews, errors };
}

/**
 * Stored grain per region (region overview only — no harvestable read), for
 * the worksite page and alerts, which cover every region with a deed rather
 * than just the enabled ones. Shares the per-region overview memo with
 * {@link getBulkRegionData}.
 */
export async function getRegionGrain(
  regionUids: string[],
  force = false
): Promise<Record<string, number>> {
  const session = getSplSession();
  if (!session) return {};
  const { username: player, token } = session;

  const overviews = await Promise.all(
    regionUids.map((uid) => regionOverview(player, token, uid, force))
  );
  return Object.fromEntries(
    regionUids.map((uid, i) => [uid, regionBalanceFrom(overviews[i]).GRAIN])
  );
}

// ── DEC balance ───────────────────────────────────────────────────────────

/** Always live — every caller reads it right before planning a spend. */
export async function getDecBalance(username: string): Promise<number> {
  return splBrowser.fetchDecBalance(username);
}

// ── Land pools (global — always live, swap math needs current reserves) ───

export async function getLandPools(): Promise<{
  pools: SplLandPool[];
  error?: string;
}> {
  try {
    return { pools: await splBrowser.fetchLandResourcesPools() };
  } catch (error) {
    return { pools: [], error: formatError(error) };
  }
}

// ── Player liquidity positions ────────────────────────────────────────────

const poolPositionCache =
  createBrowserCache<Record<string, SplPlayerPoolPosition>>(
    POOL_POSITION_TTL_MS
  );

/**
 * The player's LP position in each requested resource pool, keyed by symbol.
 * A pool the player has no position in is returned with zeroed shares rather
 * than omitted, so callers can index without null checks.
 */
export async function getPlayerPoolPositions(
  player: string,
  symbols: string[],
  force = false
): Promise<Record<string, SplPlayerPoolPosition>> {
  const key = `${player.toLowerCase()}:pool-positions:${[...symbols].sort().join(",")}|`;
  return memo(poolPositionCache, key, force, async () => {
    const results = await Promise.allSettled(
      symbols.map((symbol) =>
        splBrowser.fetchPlayerResourcePoolPosition(player, symbol)
      )
    );
    const positions: Record<string, SplPlayerPoolPosition> = {};
    symbols.forEach((symbol, i) => {
      const r = results[i];
      positions[symbol] =
        r.status === "fulfilled"
          ? r.value
          : { symbol, shares: 0, vestingShares: 0 };
    });
    return positions;
  });
}

// ── Deeds ─────────────────────────────────────────────────────────────────

export interface PlayerWorksiteData {
  deeds: DeedComplete[];
  username: string | null;
  error?: string;
}

/**
 * In-flight-only memo (no TTL): the Worksites page refreshes right after a
 * broadcast and must see the result. Coalescing only shares a request that is
 * still running — the Worksites page and the Alerts panel mount together.
 */
const worksiteDataCache = createBrowserCache<PlayerWorksiteData>(0);

/** The logged-in player's full deed data, worksite + staking joined. Always fresh. */
export async function getPlayerWorksiteData(): Promise<PlayerWorksiteData> {
  const session = getSplSession();
  if (!session) return { deeds: [], username: null, error: NOT_AUTHENTICATED };
  const player = session.username;
  return worksiteDataCache(`${player}:worksite-data|`, async () => {
    try {
      const raw = await splBrowser.fetchRegionDataPlayer(player);
      return { deeds: mapRegionDataToDeedComplete(raw), username: player };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return { deeds: [], username: player, error: msg };
    }
  });
}

// ── Mythic deeds (Keeps & Castles) ───────────────────────────────────────────

const mythicDeedsCache = createBrowserCache<MythicDeed[]>(MYTHIC_DEEDS_TTL_MS);

/**
 * The player's keeps and castles with their vault taxes. Memoised so a warmed
 * Harvest page opens instantly; `force` for the harvest plan.
 */
export async function getPlayerMythicDeeds(
  force = false
): Promise<MythicDeed[]> {
  const session = getSplSession();
  if (!session) return [];
  const player = session.username;
  return memo(mythicDeedsCache, `${player}:mythic-deeds|`, force, () =>
    loadPlayerMythicDeeds(player)
  );
}

async function loadPlayerMythicDeeds(player: string): Promise<MythicDeed[]> {
  const { deeds, worksite_details } =
    await splBrowser.fetchRegionDataPlayer(player);
  const mythicDeeds = deeds.filter(
    (d) => (d.keep ?? 0) > 0 || (d.castle ?? 0) > 0
  );
  if (mythicDeeds.length === 0) return [];

  const taxResults = await Promise.allSettled(
    mythicDeeds.map((d) => splBrowser.fetchTaxes(d.deed_uid))
  );

  const result: MythicDeed[] = mythicDeeds.map((deed, i) => {
    const wsDetail = worksite_details.find((w) => w.deed_uid === deed.deed_uid);
    const taxResult = taxResults[i];
    const taxes =
      taxResult.status === "fulfilled"
        ? taxResult.value.taxes.filter((t) => t.balance > 0)
        : [];
    const capacity =
      taxResult.status === "fulfilled" ? taxResult.value.capacity : 0;
    const kingdom_type: "keep" | "castle" =
      (deed.keep ?? 0) > 0 ? "keep" : "castle";

    return {
      deed_uid: deed.deed_uid,
      region_uid: deed.region_uid,
      region_number: deed.region_number,
      tract_number: deed.tract_number,
      kingdom_type,
      last_action_time: wsDetail?.last_action_time ?? null,
      estimated_totem_chance: wsDetail?.estimated_totem_chance ?? null,
      taxes,
      capacity,
    };
  });

  // Keeps first, then castles
  return result.sort((a, b) => {
    if (a.kingdom_type === b.kingdom_type) return 0;
    return a.kingdom_type === "keep" ? -1 : 1;
  });
}

// ── Power Core inventory ──────────────────────────────────────────────────────

export async function getPowerCoreInfo(): Promise<{
  count: number;
  ids: string[];
  error?: string;
}> {
  const session = getSplSession();
  if (!session) return { count: 0, ids: [], error: NOT_AUTHENTICATED };
  try {
    const count = await splBrowser.fetchPowerCoreCount(session.username);
    if (count === 0) return { count: 0, ids: [] };
    const allIds: string[] = [];
    let offset = 0;
    const limit = 100;
    while (allIds.length < count) {
      const batch = await splBrowser.fetchPowerCoreAvailableIds(
        session.username,
        offset,
        limit
      );
      if (batch.length === 0) break;
      allIds.push(...batch);
      if (batch.length < limit) break;
      offset += limit;
    }
    return { count, ids: allIds };
  } catch (err) {
    return { count: 0, ids: [], error: formatError(err) };
  }
}

// ── Rental / purchase authority (UI status) ─────────────────────────────────

/**
 * Status of one authority kind for the logged-in player. The service account
 * (server env) comes from a no-SPL server action; the player's lists come from
 * the browser. The server keeps its own cached read for on-behalf validation
 * (`splAuthorityService`).
 */
export interface AuthorityStatus {
  /** True when SPL_LAND_SERVICE_ACCOUNT + SPL_LAND_SERVICE_ACTIVE_KEY are set. */
  serviceConfigured: boolean;
  /** Display name of the configured service account (or null when unset). */
  serviceAccount: string | null;
  /** True only when the logged-in user has granted this authority. */
  authorized: boolean;
  /** The username the check was performed for (null when not logged in). */
  player: string | null;
  /** Current full list for this authority kind — used to smart-merge on grant. */
  accounts: string[];
}

const authorityCache =
  createBrowserCache<PlayerAuthorityLists>(AUTHORITY_TTL_MS);

/** `force` reads the live list (always do so right before building a grant/revoke op). */
export async function getAuthorityStatus(
  kind: keyof PlayerAuthorityLists,
  force = false
): Promise<AuthorityStatus> {
  const { serviceConfigured, serviceAccount } = await getAuthorityServiceInfo();
  const player = getSplSession()?.username ?? null;
  if (!player || !serviceConfigured || !serviceAccount) {
    return {
      serviceConfigured,
      serviceAccount,
      authorized: false,
      player,
      accounts: [],
    };
  }
  // A failed lookup reads as "no authorities" (and is not memoised).
  const lists = await memo(
    authorityCache,
    `${player}:authorities|`,
    force,
    () =>
      splBrowser
        .fetchPlayerAuthorities([player])
        .then((rows) => authorityListsOf(rows, player))
  ).catch((): PlayerAuthorityLists => ({ rental: [], purchase: [] }));
  const accounts = lists[kind];
  return {
    serviceConfigured,
    serviceAccount,
    authorized: hasAuthority(accounts, serviceAccount),
    player,
    accounts,
  };
}
