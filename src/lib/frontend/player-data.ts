"use client";

import { getCardDetails } from "@/lib/backend/actions/card-detail-actions";
import {
  getPlayerOverviewGlobals,
  getSharedResourcePrices,
} from "@/lib/backend/actions/player/dashboard-actions";
import { filterCardCollection } from "@/lib/backend/helpers/filterPlayerCards";
import { createBrowserCache } from "@/lib/frontend/browser-cache";
import { splBrowser } from "@/lib/frontend/spl-browser-api";
import { getSplSessionFor } from "@/lib/frontend/splSession";
import { filterDeeds, sortDeeds } from "@/lib/filters";
import {
  enrichWithProductionInfo,
  enrichWithProgressInfo,
  getDeedsAlerts,
  type GetDeedTaxes,
} from "@/lib/shared/deedEnrichment";
import { groupCards } from "@/lib/shared/player/groupedCards";
import { toPlayerLandCards } from "@/lib/shared/player/landCards";
import { buildCardAlerts } from "@/lib/shared/player/playerAlerts";
import { mapRegionDataToDeedComplete } from "@/lib/shared/deedMapping";
import {
  buildPlayerOverview,
  DASHBOARD_BALANCE_TOKENS,
} from "@/lib/shared/player/playerOverview";
import { processPlayerRegionInformation } from "@/lib/shared/player/playerRegion";
import { buildPlaygroundData } from "@/lib/shared/player/playground";
import { CardAlerts } from "@/types/cardAlerts";
import { DeedComplete } from "@/types/deed";
import { DeedAlertsInfo } from "@/types/deedAlertsInfo";
import { SplDeedHarvestActionsResponse } from "@/types/deedHarvest";
import { SplDeedProjectsResponse } from "@/types/deedProjects";
import { CardFilterInput, FilterInput } from "@/types/filters";
import { GroupedCardRow } from "@/types/groupedCardRow";
import { PlayerLandCard } from "@/types/playerLandCard";
import { PlayerOverview } from "@/types/playerOverview";
import { PlaygroundData } from "@/types/playground";
import { Prices } from "@/types/price";
import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";
import { PlayerRegionDataType } from "@/types/resource";
import { SplCardDetails } from "@/types/splCardDetails";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import { StakedAssets } from "@/types/stakedAssets";
import { SplTaxes } from "@/types/splTaxes";
import pLimit from "p-limit";

/**
 * Player-page data, loaded in the browser: the player's own SPL reads go
 * through `splBrowser` (the visitor's IP), shared data (card details, resource
 * prices, region-wide DB data) through cached server actions. The pure
 * computations run here, from lib/shared.
 *
 * Every per-player entry is keyed `<player>:...`, so
 * `invalidatePlayerBrowserCaches(player)` (a "force" refresh, or after an
 * on-chain action) makes the next read live.
 */

const PLAYER_TTL_MS = 60_000;
const SHARED_TTL_MS = 10 * 60_000;

const deedsCache = createBrowserCache<RawRegionDataResponse>(PLAYER_TTL_MS);
const collectionCache =
  createBrowserCache<SplPlayerCardCollection[]>(PLAYER_TTL_MS);
const stakedAssetsCache = createBrowserCache<StakedAssets>(PLAYER_TTL_MS);
const taxesCache = createBrowserCache<SplTaxes>(PLAYER_TTL_MS);
const cardDetailsCache = createBrowserCache<SplCardDetails[]>(SHARED_TTL_MS);
const pricesCache = createBrowserCache<Prices>(PLAYER_TTL_MS);

/** Staked-asset reads in flight at once (per tab). */
const STAKED_ASSETS_CONCURRENCY = 8;
const stakedAssetsLimit = pLimit(STAKED_ASSETS_CONCURRENCY);

const normalize = (player: string) => player.trim().toLowerCase();

// ── Raw reads (memoized per tab) ─────────────────────────────────────────────

/** `/land/deeds?player=` — the player's deeds with worksite / staking rows. */
export function loadPlayerRegionRaw(
  player: string
): Promise<RawRegionDataResponse> {
  const p = normalize(player);
  return deedsCache(`${p}:deeds`, () => splBrowser.fetchRegionDataPlayer(p));
}

/** The player's deeds as `DeedComplete` (unfiltered, API order). */
export async function loadPlayerDeedList(
  player: string
): Promise<DeedComplete[]> {
  const raw = await loadPlayerRegionRaw(player);
  return raw.deeds.length > 0 ? mapRegionDataToDeedComplete(raw) : [];
}

/** The player's deeds as `DeedComplete`, filtered. */
export async function loadPlayerDeedsFiltered(
  player: string,
  filters: FilterInput = {}
): Promise<DeedComplete[]> {
  return filterDeeds(await loadPlayerDeedList(player), filters);
}

/**
 * Card collection. Sends the session token when the viewer is that player, so
 * owner-only details are included (the key separates both variants).
 */
export function loadCardCollection(
  player: string
): Promise<SplPlayerCardCollection[]> {
  const p = normalize(player);
  const token = getSplSessionFor(p)?.token ?? null;
  return collectionCache(`${p}:collection:${token ? "auth" : "public"}`, () =>
    splBrowser.fetchPlayerCardCollection(p, token)
  );
}

export function loadStakedAssets(
  player: string,
  deedUid: string
): Promise<StakedAssets> {
  return stakedAssetsCache(`${normalize(player)}:staked:${deedUid}`, () =>
    stakedAssetsLimit(() => splBrowser.fetchStakedAssets(deedUid))
  );
}

/** Tax vault reads for one player's Keeps/Castles. */
function deedTaxesFor(player: string): GetDeedTaxes {
  const p = normalize(player);
  return (deedUid) =>
    taxesCache(`${p}:taxes:${deedUid}`, () => splBrowser.fetchTaxes(deedUid));
}

/** Shared card details (server cache; memoized per tab). */
export function loadCardDetails(): Promise<SplCardDetails[]> {
  return cardDetailsCache("card-details", () => getCardDetails());
}

/** Shared resource DEC prices (server cache; memoized per tab). */
export function loadResourcePrices(): Promise<Prices> {
  return pricesCache("resource-prices", () => getSharedResourcePrices());
}

// ── Page loaders ─────────────────────────────────────────────────────────────

/** Player dashboard (`usePlayerDashboard`). */
export async function loadPlayerOverview(
  player: string
): Promise<PlayerOverview> {
  const p = normalize(player);
  const [deeds, liquidityInfo, poolInfo, landPools, balances, prices, globals] =
    await Promise.all([
      loadPlayerDeedList(p).then((d) =>
        enrichWithProgressInfo(d, deedTaxesFor(p))
      ),
      splBrowser.fetchPlayerLiquidity(p),
      splBrowser.fetchPlayerPoolInfo(p),
      splBrowser.fetchLandResourcesPools(),
      splBrowser.fetchPlayerBalances(p, DASHBOARD_BALANCE_TOKENS),
      loadResourcePrices(),
      getPlayerOverviewGlobals(p),
    ]);

  return buildPlayerOverview({
    deeds,
    liquidityInfo,
    poolInfo,
    landPools,
    balances,
    resourcePrices: prices,
    globals,
  });
}

/** Region summary of the player's (filtered) deeds (`usePlayerRegionData`). */
export async function loadPlayerRegionData(
  player: string,
  filters: FilterInput,
  includeTaxes: boolean = true,
  includeTransferFee: boolean = true
): Promise<PlayerRegionDataType> {
  const [deeds, prices] = await Promise.all([
    loadPlayerDeedsFiltered(player, filters),
    loadResourcePrices(),
  ]);
  return processPlayerRegionInformation(
    deeds,
    prices,
    includeTaxes,
    includeTransferFee
  );
}

const DEED_LIMIT = 200;

export type FilteredDeedsResult = {
  deeds: DeedComplete[];
  warning: string | null;
  total: number;
};

/**
 * Phase 1 of the deed overview: the player's filtered and sorted deeds,
 * enriched with progress + production info but WITHOUT staked assets.
 */
export async function loadFilteredEnrichedPlayerDeeds(
  player: string,
  filters: FilterInput
): Promise<FilteredDeedsResult> {
  const [deeds, prices] = await Promise.all([
    loadPlayerDeedsFiltered(player, filters),
    loadResourcePrices(),
  ]);
  const getTaxes = deedTaxesFor(player);
  const enriched1 = await enrichWithProgressInfo(deeds, getTaxes);
  const enrichedDeeds = await enrichWithProductionInfo(
    enriched1,
    prices,
    getTaxes
  );
  const sorted = sortDeeds(enrichedDeeds, filters.sorting);

  const warning =
    sorted.length > DEED_LIMIT
      ? `Showing only ${DEED_LIMIT} of ${sorted.length} deeds due to performance limits.`
      : null;

  const deedsToReturn = sorted.slice(0, DEED_LIMIT);
  return { deeds: deedsToReturn, warning, total: deedsToReturn.length };
}

/**
 * Phase 2: adds staked assets to each deed. A deed whose read fails is
 * returned unenriched, as before.
 */
export function enrichDeedsWithStakedAssets(
  deeds: DeedComplete[]
): Promise<DeedComplete[]> {
  return Promise.all(
    deeds.map(async (deed) => {
      try {
        const stakedAssets = await loadStakedAssets(
          deed.player ?? "",
          deed.deed_uid
        );
        return { ...deed, stakedAssets };
      } catch (err) {
        console.error("Error enriching deed", deed.deed_uid, err);
        return deed;
      }
    })
  );
}

/** Card alerts for the player dashboard / land manager. */
export async function loadPlayerCardAlerts(
  player: string
): Promise<CardAlerts> {
  const p = normalize(player);
  if (!p) throw new Error("Player name is required");
  const [collection, balances, deeds, prices, cardDetails] = await Promise.all([
    loadCardCollection(p),
    splBrowser.fetchPlayerBalances(p),
    loadPlayerDeedList(p),
    loadResourcePrices(),
    loadCardDetails(),
  ]);
  const enriched = await enrichWithProductionInfo(
    deeds,
    prices,
    deedTaxesFor(p)
  );
  return buildCardAlerts(p, collection, balances, enriched, cardDetails);
}

/** "Finished building / Full store" deed alerts. */
export async function loadPlayerDeedAlerts(
  player: string
): Promise<DeedAlertsInfo[]> {
  const p = normalize(player);
  if (!p) throw new Error("Player name is required");
  const deeds = await loadPlayerDeedList(p);
  return getDeedsAlerts(await enrichWithProgressInfo(deeds, deedTaxesFor(p)));
}

/** Grouped card collection (collection overview, `usePlayerCardPP`). */
export async function loadGroupedCardCollection(
  player: string,
  cardFilters: CardFilterInput = {}
): Promise<GroupedCardRow[]> {
  if (!player) throw new Error("Player parameter is required");
  const [collection, cardDetails] = await Promise.all([
    loadCardCollection(player),
    loadCardDetails(),
  ]);
  const filtered = filterCardCollection(
    collection,
    cardDetails,
    player,
    cardFilters
  );
  return Array.from(groupCards(filtered, cardDetails).values());
}

/** The player's land-eligible cards (playground, worker picker). */
export async function loadPlayerLandCards(
  player: string
): Promise<PlayerLandCard[]> {
  if (!player) throw new Error("Player parameter is required");
  const [collection, cardDetails] = await Promise.all([
    loadCardCollection(player),
    loadCardDetails(),
  ]);
  return toPlayerLandCards(player, collection, cardDetails);
}

/** Planning playground data. */
export async function loadPlaygroundData(
  player: string
): Promise<PlaygroundData> {
  if (!player) throw new Error("Player parameter is required");
  const [regionData, collection, cardDetails] = await Promise.all([
    loadPlayerRegionRaw(player),
    loadCardCollection(player),
    loadCardDetails(),
  ]);
  return buildPlaygroundData(player, regionData, collection, cardDetails);
}

/** Full lifetime history of one deed (projects + harvests). */
export async function loadDeedHistory(deedUid: string): Promise<{
  projects: SplDeedProjectsResponse;
  harvests: SplDeedHarvestActionsResponse;
}> {
  const [projects, harvests] = await Promise.all([
    splBrowser.fetchAllDeedProjects(deedUid),
    splBrowser.fetchAllDeedHarvestActions(deedUid),
  ]);
  return { projects, harvests };
}
