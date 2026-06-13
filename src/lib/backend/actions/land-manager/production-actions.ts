"use server";

import { mapRegionDataToDeedComplete } from "@/lib/backend/api/internal/player-data";
import {
  fetchAvailableStakeCards,
  fetchAvailableStakeItems,
  fetchGroupedStakeCards,
  fetchGroupedStakeItems,
  fetchRegionDataPlayer,
} from "@/lib/backend/api/spl/spl-land-api";
import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import { getCachedStakedAssets } from "@/lib/backend/services/playerService";
import { enrichWithProductionInfo } from "@/lib/backend/services/regionService";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import {
  STAKE_TYPE_UID_LAND_POWER_CORE,
  STAKE_TYPE_UID_LAND_RUNI,
  STAKE_TYPE_UID_LAND_TITLE,
  STAKE_TYPE_UID_LAND_TOTEM,
} from "@/lib/shared/operations/opBuilders";
import {
  bcxForLevel,
  determineCardInfo,
  determineCardMaxBCX,
  findCardElement,
} from "@/lib/utils/cardUtil";
import { DeedComplete } from "@/types/deed";
import { cardElementColorMap, CardElement, CardRarity } from "@/types/planner";
import { Card } from "@/types/stakedAssets";
import pLimit from "p-limit";
import { getAuthStatus } from "../auth-actions";

/** Card detail id of the Runi card. */
const RUNI_CARD_DETAIL_ID = 505;

/**
 * Fetches the authenticated player's full deed data and enriches each deed with
 * `productionInfo` (rewards/hour produce value, consume cost, and netDEC). The
 * Production tab renders rewards-per-hour and net DEC straight from this — no
 * per-deed staked-asset calls are needed for the table (those are only fetched
 * at action time when unpowering / removing workers / emptying a plot).
 *
 * No caching — always fresh so the tab reflects the current on-chain state.
 */
export async function getProductionTabData(): Promise<{
  deeds: DeedComplete[];
  username: string | null;
  error?: string;
}> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { deeds: [], username: null, error: "Not authenticated" };
  }

  try {
    const raw = await fetchRegionDataPlayer(auth.username);
    const deeds = mapRegionDataToDeedComplete(raw);
    const prices = await getCachedResourcePrices();
    const enriched = await enrichWithProductionInfo(deeds, prices);
    return { deeds: enriched, username: auth.username };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { deeds: [], username: auth.username, error: msg };
  }
}

/** The staked UIDs on a single deed, resolved for building unstake ops. */
export interface PlotStakeAssets {
  /** All staked worker card UIDs. */
  cardUids: string[];
  /** All staked item UIDs (power core, title, totem, ...). */
  itemUids: string[];
  /** The power core item UID, if one is staked (for "unpower"). */
  powerCoreItemUid: string | null;
}

/** Above this many deeds we throttle per-call to avoid SPL rate-limit/timeouts. */
const STAKE_ASSETS_THROTTLE_THRESHOLD = 50;
/** Concurrency and per-call delay when throttling a large batch. */
const STAKE_ASSETS_THROTTLED_CONCURRENCY = 5;
const STAKE_ASSETS_THROTTLE_DELAY_MS = 750;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Resolve the staked card/item UIDs for the given deeds, fresh from the API
 * (no cache) so unstake ops act on the current on-chain state. Returns a map
 * keyed by deed_uid. Deeds that error out are omitted from the map.
 *
 * For large batches (> {@link STAKE_ASSETS_THROTTLE_THRESHOLD} deeds) the calls
 * are throttled — lower concurrency plus a short per-call delay — so the SPL
 * API doesn't reject the burst with rate-limit / timeout errors.
 */
export async function getPlotStakeAssets(
  deedUids: string[]
): Promise<Record<string, PlotStakeAssets>> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    throw new Error("Not authenticated");
  }

  const throttled = deedUids.length > STAKE_ASSETS_THROTTLE_THRESHOLD;
  const limit = pLimit(throttled ? STAKE_ASSETS_THROTTLED_CONCURRENCY : 10);
  const result: Record<string, PlotStakeAssets> = {};

  await Promise.all(
    deedUids.map((deedUid) =>
      limit(async () => {
        // Space out calls in big batches so we stay under the rate limit.
        if (throttled) await sleep(STAKE_ASSETS_THROTTLE_DELAY_MS);
        try {
          const assets = await getCachedStakedAssets(deedUid, true);
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

// ── Assignable assets (pickers) ───────────────────────────────────────────────

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
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { items: [], error: "Not authenticated" };
  }
  try {
    const stakeTypeUid = STAKE_ITEM_KIND_UID[kind];

    // The `available` endpoint only returns bare UIDs; the `grouped` endpoint
    // carries the name/boost, keyed by item_detail_id (embedded in each UID as
    // `I-<item_detail_id>-...`). Fetch the groups once to label the choices.
    const groups = await fetchGroupedStakeItems(auth.username, stakeTypeUid);
    const groupByDetailId = new Map(groups.map((g) => [g.itemDetailId, g]));

    const all: AvailableStakeItem[] = [];
    let offset = 0;
    const limit = 100;
    // Paginate until a short page comes back.
    for (;;) {
      const batch = await fetchAvailableStakeItems(
        auth.username,
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
 * `available` endpoint resolves each group's uid. Unlike the cached card
 * collection, the `delegated=true` grouped call also surfaces Runis delegated
 * *to* the player.
 */
export async function getAvailableRunis(deedUid: string): Promise<{
  runis: AvailableRuni[];
  error?: string;
}> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { runis: [], error: "Not authenticated" };
  }
  try {
    const groups = await fetchGroupedStakeCards(
      auth.username,
      STAKE_TYPE_UID_LAND_RUNI,
      deedUid
    );

    const runis: AvailableRuni[] = [];
    for (const group of groups) {
      let offset = 0;
      const limit = 100;
      // Paginate until a short page comes back.
      for (;;) {
        const batch = await fetchAvailableStakeCards(
          auth.username,
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

// ── Per-plot staked spots (Configure panel) ──────────────────────────────────

/** A staked card (worker or runi), enriched for display in the Configure panel. */
export interface ConfigCard {
  uid: string;
  name: string;
  rarity: CardRarity;
  set: string;
  element: CardElement;
  secondaryElement: CardElement | null;
  edition: number;
  foil: number;
  bcx: number;
  maxBcx: number;
  basePP: number;
  boostedPP: number;
  terrainBoost: number;
  /** Worker slot (1-5); 0/undefined for runi. */
  slot: number;
}

/** A staked item (power core / totem / title) for the Configure panel. */
export interface ConfigItem {
  uid: string;
  name: string;
  stakeTypeUid: string;
  boost: number;
}

/** The current staked occupant of each spot on a plot. */
export interface PlotConfigureData {
  deedUid: string;
  powerCore: ConfigItem | null;
  runi: ConfigCard | null;
  /** Worker cards, sorted by slot. */
  workers: ConfigCard[];
  totem: ConfigItem | null;
  title: ConfigItem | null;
}

/**
 * Resolve what is currently staked in each spot of a plot (power core, runi, up
 * to 5 workers, totem, title), fresh from the API and enriched with display
 * info (name / rarity / max bcx), for the Configure panel.
 */
export async function getPlotConfigureData(
  deedUid: string
): Promise<PlotConfigureData> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    throw new Error("Not authenticated");
  }

  const [assets, cardDetails] = await Promise.all([
    getCachedStakedAssets(deedUid, true),
    getCachedCardDetailsData(),
  ]);
  const cards = assets.cards ?? [];
  const items = assets.items ?? [];

  const isRuni = (c: Card) =>
    c.stake_type_uid === STAKE_TYPE_UID_LAND_RUNI ||
    c.card_detail_id === RUNI_CARD_DETAIL_ID;

  const toConfigCard = (c: Card): ConfigCard => {
    const { name, rarity } = determineCardInfo(c.card_detail_id, cardDetails);
    const splCard = cardDetails.find((cd) => cd.id === c.card_detail_id);
    const secondaryElement: CardElement | null = splCard?.secondary_color
      ? (cardElementColorMap[splCard.secondary_color.toLowerCase()] ?? null)
      : null;
    return {
      uid: c.uid,
      name,
      rarity,
      set: c.card_set,
      element: findCardElement(cardDetails, c.card_detail_id),
      secondaryElement,
      edition: c.edition,
      foil: c.foil,
      bcx: c.bcx,
      maxBcx: determineCardMaxBCX(c.card_set, rarity, c.foil),
      basePP: Number(c.base_pp_after_cap),
      boostedPP: Number(c.total_harvest_pp),
      terrainBoost: Number(c.terrain_boost),
      slot: c.slot,
    };
  };

  const toConfigItem = (uid: string): ConfigItem | null => {
    const item = items.find((i) => i.stake_type_uid === uid);
    return item
      ? {
          uid: item.uid,
          name: item.name,
          stakeTypeUid: item.stake_type_uid,
          boost: item.boost,
        }
      : null;
  };

  const runiCard = cards.find(isRuni);

  return {
    deedUid,
    powerCore: toConfigItem(STAKE_TYPE_UID_LAND_POWER_CORE),
    runi: runiCard ? toConfigCard(runiCard) : null,
    workers: cards
      .filter((c) => !isRuni(c))
      .sort((a, b) => a.slot - b.slot)
      .map(toConfigCard),
    totem: toConfigItem(STAKE_TYPE_UID_LAND_TOTEM),
    title: toConfigItem(STAKE_TYPE_UID_LAND_TITLE),
  };
}
