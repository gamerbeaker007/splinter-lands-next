"use client";

import { getLandManagerConfig } from "@/lib/backend/actions/land-manager/config-actions";
import {
  buildPlotConfigureData,
  getProductionContext,
  type PlotConfigureData,
} from "@/lib/backend/actions/land-manager/production-actions";
import { getSeasonSettings } from "@/lib/backend/actions/land-manager/renew-rental-actions";
import {
  getBuyPlanCandidates,
  getRentalPlanCandidates,
} from "@/lib/backend/actions/land-manager/worker-actions";
import { createBrowserCache } from "@/lib/frontend/browser-cache";
import { getDecBalance } from "@/lib/frontend/land-data";
import { splBrowser } from "@/lib/frontend/spl-browser-api";
import { loadCardCollection } from "@/lib/frontend/player-data";
import { getSplSession } from "@/lib/frontend/splSession";
import {
  buildDecPowerPlan,
  DecPowerDirection,
  DecPowerPlan,
  EMPTY_STAKED_DEC,
  RegionStakedDEC,
  regionStakedDecFrom,
} from "@/lib/shared/decPower";
import { enrichWithProductionInfo } from "@/lib/shared/deedEnrichment";
import { mapRegionDataToDeedComplete } from "@/lib/shared/deedMapping";
import {
  STAKE_TYPE_UID_LAND_POWER_CORE,
  STAKE_TYPE_UID_LAND_RUNI,
  STAKE_TYPE_UID_LAND_TITLE,
  STAKE_TYPE_UID_LAND_TOTEM,
} from "@/lib/shared/operations/opBuilders";
import {
  buildRenewRentalPlan,
  emptyRenewRentalPlan,
  renewRentalsEligibility,
  rentedCardsListFrom,
  type RentedCardsList,
} from "@/lib/shared/rentals";
import { calcTaxProductionInfo } from "@/lib/shared/taxProduction";
import {
  computeWorkerEligibility,
  filterEligiblePlots,
} from "@/lib/shared/workerEligibility";
import {
  buildBuyPlanWith,
  buildRentalPlanWith,
  type BuyExecutionPlan,
  priceBuyListing,
  priceRentalListing,
  type RentalExecutionPlan,
} from "@/lib/shared/workerPlan";
import { bcxForLevel } from "@/lib/utils/cardUtil";
import type { DeedComplete } from "@/types/deed";
import {
  BuyConfig,
  BuyPlan,
  DEFAULT_BUY_CONFIG,
  DEFAULT_RENTAL_CONFIG,
  RenewRentalPlan,
  RentalConfig,
  RentalPlan,
  WorkerEligibilityResult,
} from "@/types/landManager";
import type { RawRegionDataResponse } from "@/types/RawRegionDataResponse";
import type { SplProductionOverviewRegion } from "@/types/spl/landManager";
import type { StakedAssets } from "@/types/stakedAssets";
import pLimit from "p-limit";

/**
 * The Production / workers / DEC power / rentals reads of the land manager,
 * run in the visitor's browser (see CLAUDE.md). Each replaces a server action
 * that read the same SPL data with the server's IP; computations run on pure
 * functions in lib/shared, and only shared data (prices, region tax, card
 * details, grouped market, settings) still comes from cached server actions.
 *
 * The player is always the logged-in one (the session store). Short memos
 * (keyed `<player>:...`, dropped by `invalidatePlayerBrowserCaches` after a
 * broadcast) dedupe the panels that mount together; `fresh` reads skip them
 * right before a plan is executed.
 */

const NOT_AUTHENTICATED = "Not authenticated";

function sessionPlayer(): string | null {
  return getSplSession()?.username ?? null;
}

/** `cached`, or a fresh load that replaces the memo when `fresh` is set. */
function memo<T>(
  cache: ReturnType<typeof createBrowserCache<T>>,
  key: string,
  fresh: boolean,
  load: () => Promise<T>
): Promise<T> {
  // Keys end in "|" so invalidating one never prefix-matches a longer key.
  if (fresh) cache.invalidate(key);
  return cache(key, load);
}

// ── Deeds ─────────────────────────────────────────────────────────────────

const DEEDS_TTL_MS = 15_000;
const deedsCache = createBrowserCache<RawRegionDataResponse>(DEEDS_TTL_MS);

/** The logged-in player's raw deed data (`/land/deeds?player=`). */
function loadPlayerDeeds(
  player: string,
  fresh = false
): Promise<RawRegionDataResponse> {
  return memo(deedsCache, `${player}:deeds|`, fresh, () =>
    splBrowser.fetchRegionDataPlayer(player)
  );
}

/**
 * Plots that can take more workers (powered, with empty slots) and
 * powered-off plots that were skipped.
 */
export async function getWorkerEligibility(
  fresh = false
): Promise<WorkerEligibilityResult> {
  const player = sessionPlayer();
  if (!player) return { eligible: [], unpoweredSkipped: [] };
  return computeWorkerEligibility(await loadPlayerDeeds(player, fresh));
}

/**
 * Castle/keep plots valued per hour: captured tax per hour with the grain
 * upkeep as a flat fee (the planner formula). The generic enrichment would
 * value them by their current vault balance instead.
 */
function withPerHourTaxProduction(
  deed: DeedComplete,
  context: Awaited<ReturnType<typeof getProductionContext>>
): DeedComplete {
  const ws = deed.worksiteDetail!;
  return {
    ...deed,
    productionInfo: calcTaxProductionInfo(
      ws.worksite_type ?? "",
      context.regionTax[deed.region_number],
      deed.tract_number,
      ws.captured_tax_rate ?? 0,
      context.prices
    ),
  };
}

const isTaxDeed = (deed: DeedComplete) =>
  deed.worksiteDetail?.token_symbol === "TAX";

/**
 * The player's full deed data, each deed enriched with `productionInfo`
 * (rewards/hour produce value, consume cost, and netDEC). The Production page
 * renders rewards-per-hour and net DEC straight from this — no per-deed
 * staked-asset calls are needed for the table. Always fresh so the page
 * reflects the current on-chain state.
 */
export async function getProductionPageData(): Promise<{
  deeds: DeedComplete[];
  username: string | null;
  error?: string;
}> {
  const player = sessionPlayer();
  if (!player) return { deeds: [], username: null, error: NOT_AUTHENTICATED };

  try {
    const deeds = mapRegionDataToDeedComplete(
      await loadPlayerDeeds(player, true)
    );
    const taxRegions = [
      ...new Set(deeds.filter(isTaxDeed).map((d) => d.region_number)),
    ];
    const context = await getProductionContext(taxRegions);
    // Tax plots are valued from the region tax context, so the generic
    // enrichment (which would read each vault) only sees the others.
    const enriched = await enrichWithProductionInfo(
      deeds.filter((d) => !isTaxDeed(d)),
      context.prices,
      () => Promise.reject(new Error("tax plots are valued per hour"))
    );
    const byUid = new Map(enriched.map((d) => [d.deed_uid, d]));
    return {
      deeds: deeds.map((d) =>
        isTaxDeed(d)
          ? withPerHourTaxProduction(d, context)
          : (byUid.get(d.deed_uid) ?? d)
      ),
      username: player,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { deeds: [], username: player, error: msg };
  }
}

// ── Staked assets ─────────────────────────────────────────────────────────

/** The staked UIDs on a single deed, resolved for building unstake ops. */
export interface PlotStakeAssets {
  /** All staked worker card UIDs. */
  cardUids: string[];
  /** All staked item UIDs (power core, title, totem, ...). */
  itemUids: string[];
  /** The power core item UID, if one is staked (for "unpower"). */
  powerCoreItemUid: string | null;
}

/** Concurrent staked-asset reads from one browser. */
const STAKE_ASSETS_CONCURRENCY = 5;
/** Above this many deeds each call is also spaced out (SPL rate limit). */
const STAKE_ASSETS_THROTTLE_THRESHOLD = 50;
const STAKE_ASSETS_THROTTLE_DELAY_MS = 750;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Resolve the staked card/item UIDs for the given deeds, fresh from the API so
 * unstake ops act on the current on-chain state. Returns a map keyed by
 * deed_uid; deeds that error out are omitted.
 */
export async function getPlotStakeAssets(
  deedUids: string[]
): Promise<Record<string, PlotStakeAssets>> {
  if (!sessionPlayer()) throw new Error(NOT_AUTHENTICATED);

  const throttled = deedUids.length > STAKE_ASSETS_THROTTLE_THRESHOLD;
  const limit = pLimit(STAKE_ASSETS_CONCURRENCY);
  const result: Record<string, PlotStakeAssets> = {};

  await Promise.all(
    deedUids.map((deedUid) =>
      limit(async () => {
        if (throttled) await sleep(STAKE_ASSETS_THROTTLE_DELAY_MS);
        try {
          const assets = await splBrowser.fetchStakedAssets(deedUid);
          const items = assets.items ?? [];
          result[deedUid] = {
            cardUids: (assets.cards ?? []).map((c) => c.uid),
            itemUids: items.map((i) => i.uid),
            powerCoreItemUid:
              items.find(
                (i) => i.stake_type_uid === STAKE_TYPE_UID_LAND_POWER_CORE
              )?.uid ?? null,
          };
        } catch (err) {
          console.error("Failed to load staked assets", deedUid, err);
        }
      })
    )
  );

  return result;
}

/**
 * What is currently staked in each spot of a plot, fresh from the API, with
 * display info added server-side (card details), for the Configure panel.
 */
export async function getPlotConfigureData(
  deedUid: string
): Promise<PlotConfigureData> {
  if (!sessionPlayer()) throw new Error(NOT_AUTHENTICATED);
  const assets: StakedAssets = await splBrowser.fetchStakedAssets(deedUid);
  return buildPlotConfigureData(deedUid, assets);
}

/** Empty worker slots of every plot that has picks to stake (1-based). */
async function fetchEmptySlotsByDeed(
  plan: RentalPlan | BuyPlan
): Promise<Record<string, number[]>> {
  const plots = plan.items.filter((i) => i.picks.length > 0).map((i) => i.plot);
  const emptySlotsByDeed: Record<string, number[]> = {};
  const limit = pLimit(STAKE_ASSETS_CONCURRENCY);

  await Promise.all(
    plots.map((plot) =>
      limit(async () => {
        try {
          const assets = await splBrowser.fetchStakedAssets(plot.deed_uid);
          const occupied = new Set((assets.cards ?? []).map((c) => c.slot));
          const all = Array.from({ length: plot.max_workers }, (_, i) => i + 1);
          emptySlotsByDeed[plot.deed_uid] = all.filter((s) => !occupied.has(s));
        } catch {
          emptySlotsByDeed[plot.deed_uid] = [];
        }
      })
    )
  );
  return emptySlotsByDeed;
}

// ── Assignable assets (pickers) ───────────────────────────────────────────

/** Which kind of land stake item to fetch available choices for. */
export type StakeItemKind = "powerCore" | "totem" | "title";

const STAKE_ITEM_KIND_UID: Record<StakeItemKind, string> = {
  powerCore: STAKE_TYPE_UID_LAND_POWER_CORE,
  totem: STAKE_TYPE_UID_LAND_TOTEM,
  title: STAKE_TYPE_UID_LAND_TITLE,
};

/**
 * Stake item UIDs encode their item_detail_id as the middle segment
 * (`I-<item_detail_id>-<suffix>`). Returns NaN if the UID doesn't match, so
 * lookups in the grouped map simply miss.
 */
function itemDetailIdFromUid(uid: string): number {
  return Number(uid.split("-")[1]);
}

/** An item the player can stake into a plot spot. */
export interface AvailableStakeItem {
  uid: string;
  name: string | null;
  rarity: string | null;
  boost: number | null;
}

/**
 * All unstaked items of a given kind (power core / totem / title) the player
 * can assign to a plot, with name/rarity/boost for labelling the picker.
 */
export async function getAvailableStakeItems(
  kind: StakeItemKind
): Promise<{ items: AvailableStakeItem[]; error?: string }> {
  const player = sessionPlayer();
  if (!player) return { items: [], error: NOT_AUTHENTICATED };
  try {
    const stakeTypeUid = STAKE_ITEM_KIND_UID[kind];

    // The `available` endpoint only returns bare UIDs; the `grouped` endpoint
    // carries the name/boost, keyed by item_detail_id (embedded in each UID as
    // `I-<item_detail_id>-...`). Fetch the groups once to label the choices.
    const groups = await splBrowser.fetchGroupedStakeItems(
      player,
      stakeTypeUid
    );
    const groupByDetailId = new Map(groups.map((g) => [g.itemDetailId, g]));

    const all: AvailableStakeItem[] = [];
    let offset = 0;
    const limit = 100;
    // Paginate until a short page comes back.
    for (;;) {
      const batch = await splBrowser.fetchAvailableStakeItems(
        player,
        stakeTypeUid,
        offset,
        limit
      );
      for (const item of batch) {
        const group = groupByDetailId.get(itemDetailIdFromUid(item.uid));
        all.push({
          ...item,
          name: item.name ?? group?.name ?? null,
          boost: item.boost ?? group?.boost ?? null,
        });
      }
      if (batch.length < limit) break;
      offset += limit;
    }
    return { items: all };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { items: [], error: msg };
  }
}

/** A Runi card the player can stake (card_detail_id 505, not staked on land). */
export interface AvailableRuni {
  uid: string;
  name: string;
  edition: number;
  foil: number;
  bcx: number;
  level: number;
}

/** Runi display level (1-4) from its BCX, using legendary combine rates. */
function runiLevelFromBcx(foil: number, bcx: number): number {
  let level = 1;
  for (let lvl = 1; lvl <= 4; lvl++) {
    if (bcx >= bcxForLevel("legendary", foil, lvl)) level = lvl;
  }
  return level;
}

/**
 * The Runi cards the player can assign to `deedUid`'s Runi spot, mirroring how
 * {@link getAvailableStakeItems} works: the `grouped` cards endpoint enumerates
 * the assignable groups (one per Runi, since the name embeds the uid) and the
 * `available` endpoint resolves each group's uid. The `delegated=true` grouped
 * call also surfaces Runis delegated *to* the player.
 */
export async function getAvailableRunis(deedUid: string): Promise<{
  runis: AvailableRuni[];
  error?: string;
}> {
  const player = sessionPlayer();
  if (!player) return { runis: [], error: NOT_AUTHENTICATED };
  try {
    const groups = await splBrowser.fetchGroupedStakeCards(
      player,
      STAKE_TYPE_UID_LAND_RUNI,
      deedUid
    );

    const runis: AvailableRuni[] = [];
    for (const group of groups) {
      let offset = 0;
      const limit = 100;
      // Paginate until a short page comes back.
      for (;;) {
        const batch = await splBrowser.fetchAvailableStakeCards(
          player,
          STAKE_TYPE_UID_LAND_RUNI,
          deedUid,
          {
            cardDetailId: group.cardDetailId,
            bcx: group.bcx,
            gold: group.gold,
            edition: group.edition,
            name: group.name,
          },
          offset,
          limit
        );
        for (const c of batch) {
          runis.push({
            uid: c.uid,
            name: "Runi",
            edition: c.edition,
            foil: c.foil,
            bcx: c.bcx,
            level: runiLevelFromBcx(c.foil, c.bcx),
          });
        }
        if (batch.length < limit) break;
        offset += limit;
      }
    }
    return { runis };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { runis: [], error: msg };
  }
}

// ── DEC power (JWT production overview) ───────────────────────────────────

/** In-flight-only: the region-data hook and Configure panel ask together. */
const productionRegionsCache =
  createBrowserCache<SplProductionOverviewRegion[]>(0);

/**
 * Per-region DEC rows (all regions, or `regionNumbers` when given) from the
 * player's production overview. Always live.
 */
export async function getRegionStakedDEC(
  regionNumbers?: number[] | null
): Promise<RegionStakedDEC> {
  const session = getSplSession();
  if (!session) return EMPTY_STAKED_DEC;
  if (Array.isArray(regionNumbers) && regionNumbers.length === 0) {
    return EMPTY_STAKED_DEC;
  }
  const regions = await productionRegionsCache(
    `${session.username}:production-overview|`,
    async () =>
      (
        await splBrowser.fetchProductionOverview(
          session.username,
          session.token
        )
      ).regions
  );
  return regionStakedDecFrom(regions, regionNumbers);
}

/** How much DEC to power up/down, and where (see `buildDecPowerPlan`). */
export async function getDecPowerPlan(
  direction: DecPowerDirection
): Promise<DecPowerPlan> {
  if (!sessionPlayer()) return { items: [], total_dec: 0 };
  return buildDecPowerPlan(direction, await getRegionStakedDEC());
}

// ── Card collection (rentals) ─────────────────────────────────────────────

/** Per-card breakdown of rentals the player is paying for. */
export async function getRentedCardsList(): Promise<RentedCardsList> {
  const player = sessionPlayer();
  if (!player) {
    return { cards: [], total_dec_per_day: 0, total_dec_for_duration: 0 };
  }
  return rentedCardsListFrom(await loadCardCollection(player), player);
}

/** Whether the Renew Rentals button applies (season ending + has rentals). */
export async function getRenewRentalsEligibility(): Promise<{
  season_days_remaining: number;
  has_rentals: boolean;
  eligible: boolean;
}> {
  const player = sessionPlayer();
  if (!player) {
    return { season_days_remaining: 0, has_rentals: false, eligible: false };
  }
  const [settings, cards] = await Promise.all([
    getSeasonSettings(),
    loadCardCollection(player),
  ]);
  return renewRentalsEligibility(settings, cards, player);
}

/**
 * The full renewal plan. Always reads a fresh card collection — rental state
 * (next_rental_payment, market_id) changes after each renewal and a stale one
 * would cause double-renewals.
 */
export async function getRenewRentalPlan(): Promise<RenewRentalPlan> {
  const player = sessionPlayer();
  if (!player) return emptyRenewRentalPlan(0);

  const [settings, cards, decBalance, config] = await Promise.all([
    getSeasonSettings(),
    // Past the memo: read live.
    splBrowser.fetchPlayerCardCollection(player, getSplSession()?.token),
    getDecBalance(player),
    getLandManagerConfig(),
  ]);

  return buildRenewRentalPlan({
    username: player,
    settings,
    cards,
    decBalance,
    landRentersOnly: config?.rental.land_renters_only ?? false,
  });
}

// ── Worker rental / buy plans ─────────────────────────────────────────────

/**
 * Eligible plots → rental plan (live listings from the browser, candidates
 * from the server) → empty slots per plot. `fresh` re-reads the deeds, for
 * the re-plan right before broadcast.
 */
export async function getRentalExecutionPlan(
  rental: RentalConfig = DEFAULT_RENTAL_CONFIG,
  filteredDeedUids?: string[],
  fresh = false
): Promise<RentalExecutionPlan> {
  const { eligible } = await getWorkerEligibility(fresh);
  const plan = await buildRentalPlanWith(
    filterEligiblePlots(eligible, filteredDeedUids),
    rental,
    {
      label: "rental",
      loadCandidates: getRentalPlanCandidates,
      fetchListings: (cardDetailId, foil, edition) =>
        splBrowser.fetchMarketListingsByCard({
          cardDetailId,
          foil,
          edition,
          type: "rent",
          rentalType: "season",
        }),
      priceListing: priceRentalListing,
    }
  );
  return { plan, emptySlotsByDeed: await fetchEmptySlotsByDeed(plan) };
}

/** Buy counterpart of {@link getRentalExecutionPlan} (same eligible plots). */
export async function getBuyExecutionPlan(
  buy: BuyConfig = DEFAULT_BUY_CONFIG,
  filteredDeedUids?: string[],
  fresh = false
): Promise<BuyExecutionPlan> {
  const { eligible } = await getWorkerEligibility(fresh);
  const plan = await buildBuyPlanWith(
    filterEligiblePlots(eligible, filteredDeedUids),
    buy,
    {
      label: "buy",
      loadCandidates: getBuyPlanCandidates,
      fetchListings: (cardDetailId, foil, edition) =>
        splBrowser.fetchMarketListingsByCard({
          cardDetailId,
          foil,
          edition,
          type: "sell",
          // By-card level: 99 = max (mirrors the grouped max-level selection).
          level: 99,
        }),
      priceListing: priceBuyListing,
    }
  );
  return { plan, emptySlotsByDeed: await fetchEmptySlotsByDeed(plan) };
}
