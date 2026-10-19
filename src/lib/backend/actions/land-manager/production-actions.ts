"use server";

import { getCachedRegionDataSSR } from "@/lib/backend/api/internal/deed-data";
import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import { calculateRegionTax } from "@/lib/backend/services/regionService";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import {
  STAKE_TYPE_UID_LAND_POWER_CORE,
  STAKE_TYPE_UID_LAND_RUNI,
  STAKE_TYPE_UID_LAND_TITLE,
  STAKE_TYPE_UID_LAND_TOTEM,
} from "@/lib/shared/operations/opBuilders";
import {
  determineCardInfo,
  determineCardMaxBCX,
  determineLandBoosts,
  findCardElement,
} from "@/lib/utils/cardUtil";
import {
  CardBloodline,
  CardElement,
  cardElementColorMap,
  cardFoilOptions,
  CardRarity,
  LandBoost,
} from "@/types/planner";
import { Prices } from "@/types/price";
import { RegionTax } from "@/types/regionTax";
import { Card, Item, StakedAssets } from "@/types/stakedAssets";

/**
 * Server half of the Production page. The player's own deeds and staked
 * assets are read in the browser (lib/frontend/land-production-data.ts); these
 * actions only add what needs server-side shared data — resource prices, the
 * region-wide tax dataset (DB) and card details — so they make no SPL call.
 */

/** Card detail id of the Runi card. */
const RUNI_CARD_DETAIL_ID = 505;

/**
 * Prices and the per-hour tax context the Production page values deeds with.
 *
 * Castle/keep plots are valued as captured tax per hour (the same planner
 * formula as the Planning page), which needs region-wide data — every plot in
 * the region/tract is taxed — so the region tax summaries come from the cached
 * region dataset, limited to `taxRegionNumbers` (the regions the player holds
 * a castle/keep in).
 */
export async function getProductionContext(
  taxRegionNumbers: number[]
): Promise<{ prices: Prices; regionTax: Record<number, RegionTax> }> {
  const prices = await getCachedResourcePrices();
  const regionTax: Record<number, RegionTax> = {};
  if (taxRegionNumbers.length === 0) return { prices, regionTax };

  const wanted = new Set(taxRegionNumbers);
  const regionData = await getCachedRegionDataSSR();
  for (const region of calculateRegionTax(regionData, prices)) {
    const regionNumber = region.castleOwner.regionNumber;
    if (wanted.has(regionNumber)) regionTax[regionNumber] = region;
  }
  return { prices, regionTax };
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
  landBasePP: number;
  landBoostedPP: number;
  bloodline?: CardBloodline;
  landBoosts?: LandBoost;
  terrainBoost: number;
  /** Worker slot (1-5); 0/undefined for runi. */
  slot: number;
  onWagon: boolean;
  inSet: boolean;
  isListed: boolean;
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
 * Enrich what is currently staked in each spot of a plot (power core, runi, up
 * to 5 workers, totem, title) with display info (name / rarity / max bcx), for
 * the Configure panel. The browser reads `assets` fresh from SPL; only the
 * card details lookup happens here.
 */
/** The stake fields the Configure data is built from (small upload). */
export type ConfigureCardInput = Pick<
  Card,
  | "uid"
  | "card_detail_id"
  | "card_set"
  | "edition"
  | "foil"
  | "bcx"
  | "slot"
  | "stake_type_uid"
  | "base_pp_after_cap"
  | "total_harvest_pp"
  | "terrain_boost"
>;
export type ConfigureItemInput = Pick<
  Item,
  "uid" | "name" | "stake_type_uid" | "boost"
>;
export interface ConfigureAssetsInput {
  cards?: ConfigureCardInput[];
  items?: ConfigureItemInput[];
}

function mapPlotConfigureData(
  deedUid: string,
  assets: ConfigureAssetsInput,
  cardDetails: Awaited<ReturnType<typeof getCachedCardDetailsData>>
): PlotConfigureData {
  const cards = assets.cards ?? [];
  const items = assets.items ?? [];

  const isRuni = (c: ConfigureCardInput) =>
    c.stake_type_uid === STAKE_TYPE_UID_LAND_RUNI ||
    c.card_detail_id === RUNI_CARD_DETAIL_ID;

  const toConfigCard = (c: ConfigureCardInput): ConfigCard => {
    const { name, rarity } = determineCardInfo(c.card_detail_id, cardDetails);
    const splCard = cardDetails.find((cd) => cd.id === c.card_detail_id);
    const foil = cardFoilOptions[c.foil] ?? "regular";
    const secondaryElement: CardElement | null = splCard?.secondary_color
      ? (cardElementColorMap[splCard.secondary_color.toLowerCase()] ?? null)
      : null;
    const landBoosts =
      c.card_set === "land"
        ? determineLandBoosts(rarity, foil, c.bcx, splCard)
        : undefined;
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
      bloodline: (splCard?.sub_type ?? "Unknown") as CardBloodline,
      landBoosts,
      landBasePP: Number(c.base_pp_after_cap),
      landBoostedPP: Number(c.total_harvest_pp),
      terrainBoost: Number(c.terrain_boost),
      slot: c.slot,
      onWagon: false, // is on land so not on wagon
      inSet: false, // is on land so not in set
      isListed: false, // is on land so not listed for sale
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

export async function buildPlotConfigureData(
  deedUid: string,
  assets: StakedAssets
): Promise<PlotConfigureData> {
  return mapPlotConfigureData(
    deedUid,
    assets,
    await getCachedCardDetailsData()
  );
}

/** Enrich several browser-fetched stake snapshots in one server action call. */
export async function buildPlotConfigureDataBatch(
  entries: Array<{ deedUid: string; assets: ConfigureAssetsInput }>
): Promise<Record<string, PlotConfigureData>> {
  const cardDetails = await getCachedCardDetailsData();
  const results = await Promise.all(
    entries.map(
      ({ deedUid, assets }) =>
        [deedUid, mapPlotConfigureData(deedUid, assets, cardDetails)] as const
    )
  );
  return Object.fromEntries(results);
}
