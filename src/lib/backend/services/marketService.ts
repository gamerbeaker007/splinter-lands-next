import { Deed } from "@/generated/prisma";
import { determineCardInfo, findCardElement } from "@/lib/utils/cardUtil";
import { CardSetNameLandValid, editionMap } from "@/types/editions";
import {
  cardFoilOptions,
  DeedType,
  PlotRarity,
  PlotStatus,
  TitleTier,
  TotemRarity,
} from "@/types/planner";
import {
  LowestCardPriceEntry,
  LowestDeedPriceEntry,
  LowestMarketData,
  LowestTitlePriceEntry,
  LowestTotemPriceEntry,
  titleTierMap,
} from "@/types/planner/market/market";
import { SplCardDetails } from "@/types/splCardDetails";
import { SplMarketAsset } from "@/types/splMarketAsset";
import { SplMarketCardData } from "@/types/splMarketCardData copy";
import { fetchMarketCardData } from "../api/spl/spl-base-api";
import {
  fetchAssetsPrices,
  fetchMarketLandData,
} from "../api/spl/spl-land-api";
import { cache } from "../cache/cache";

export async function getCachedMarketData(
  cardDetails: SplCardDetails[],
  force = false
): Promise<LowestMarketData> {
  const key = `market-data`;
  if (!force) {
    const cached = cache.get<LowestMarketData>(key);
    if (cached) return cached;
  }

  const cardMarket = await fetchMarketCardData();
  const lowestCardPrices = getLowestCardPriceList(cardDetails, cardMarket);

  const landMarket = await fetchMarketLandData();
  const lowestDeedPrices = getLowestDeedPriceList(landMarket);

  const otherMarketItems = await fetchAssetsPrices([
    "TITLES",
    "TOTEMS",
    "TOTEM_ITEMS",
  ]);

  const lowestTotemPrices = getLowestTotemPriceList(otherMarketItems);
  const lowestTitlePrices = getLowestTitlePriceList(otherMarketItems);

  const lowestMarketData = {
    lowestCardPrices,
    lowestDeedPrices,
    lowestTotemPrices,
    lowestTitlePrices,
  };
  cache.set(key, lowestMarketData);
  return lowestMarketData;
}

export function getLowestCardPriceList(
  cardDetails: SplCardDetails[],
  cards: SplMarketCardData[]
): LowestCardPriceEntry[] {
  const map = new Map<string, LowestCardPriceEntry>();
  for (const card of cards) {
    const { name, rarity } = determineCardInfo(
      card.card_detail_id,
      cardDetails
    );
    const element = findCardElement(cardDetails, card.card_detail_id);
    const foil = cardFoilOptions[card.foil];
    const set = editionMap[card.edition].setName;
    const key = `${rarity}|${element}|${foil}|${set}`;
    if (
      !map.has(key) ||
      card.low_price_bcx < (map.get(key)?.low_price_bcx ?? Infinity)
    ) {
      map.set(key, {
        rarity,
        element,
        edition: card.edition,
        set: set as CardSetNameLandValid,
        foil,
        low_price_bcx: card.low_price_bcx,
        card_detail_id: card.card_detail_id,
        name,
      });
    }
  }
  return Array.from(map.values());
}

export function getLowestDeedPriceList(deeds: Deed[]): LowestDeedPriceEntry[] {
  const map = new Map<string, LowestDeedPriceEntry>();
  for (const deed of deeds) {
    const rarity = deed.rarity as PlotRarity;
    const status = deed.plot_status as PlotStatus;
    const deedType = deed.deed_type?.toLowerCase() as DeedType;
    const worksiteType = deed.worksite_type || undefined;
    const price = Number(deed.listing_price ?? 0);

    // Add worksiteType to key if it's KEEP or CASTLE
    let key = `${rarity}|${status}|${deedType}`;
    if (worksiteType === "KEEP" || worksiteType === "CASTLE") {
      key += `|${worksiteType}`;
    }

    // When it's KEEP or CASTLE, also include worksiteType in the result object
    if (!map.has(key) || price < (map.get(key)?.listing_price ?? Infinity)) {
      map.set(key, {
        rarity,
        status,
        deedType,
        listing_price: price,
        deed_uid: deed.deed_uid,
        ...(worksiteType === "KEEP" || worksiteType === "CASTLE"
          ? { worksiteType }
          : {}),
      });
    }
  }
  return Array.from(map.values());
}

export function getLowestTotemPriceList(
  items: SplMarketAsset[]
): LowestTotemPriceEntry[] {
  const result: Record<string, LowestTotemPriceEntry> = {};
  for (const item of items) {
    if (item.assetName === "TOTEMS" || item.assetName === "TOTEM_ITEMS") {
      const rarity =
        (item.detailName &&
          (item.detailName.split(" ")[0].toLowerCase() as TotemRarity)) ||
        "common";

      const priceObj = Array.isArray(item.prices)
        ? item.prices.find((p) => p.currency === "USD")
        : null;
      const price = priceObj?.minPrice ?? null;
      if (
        rarity &&
        price !== null &&
        (!result[rarity] || price < result[rarity].listing_price)
      ) {
        result[rarity] = {
          rarity,
          listing_price: price,
        };
      }
    }
  }
  return Object.values(result);
}

export function getLowestTitlePriceList(
  items: SplMarketAsset[]
): LowestTitlePriceEntry[] {
  const result: Record<Exclude<TitleTier, "none">, LowestTitlePriceEntry> = {};

  for (const item of items) {
    if (item.assetName === "TITLES") {
      // Try to map detailName to rarity
      const rarity = titleTierMap[item.detailName] as Exclude<
        TitleTier,
        "none"
      >;
      const priceObj = Array.isArray(item.prices)
        ? item.prices.find((p) => p.currency === "USD")
        : null;
      const price = priceObj?.minPrice ?? null;
      if (
        rarity &&
        price !== null &&
        (!result[rarity] || price < result[rarity].listing_price)
      ) {
        result[rarity] = {
          rarity,
          listing_price: price,
          titleName: item.detailName,
        };
      }
    }
  }
  return Object.values(result);
}
