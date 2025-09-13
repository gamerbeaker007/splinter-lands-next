import { Deed } from "@/generated/prisma";
import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import {
  getCachedMarketCardData,
  getCachedMarketLandData,
} from "@/lib/backend/services/marketService";
import {
  findCardElement,
  findCardRarity,
  findCardSet,
} from "@/lib/utils/cardUtil";
import { DeedType, PlotRarity, PlotStatus } from "@/types/planner";
import {
  LowestCardPriceEntry,
  LowestDeedPriceEntry,
} from "@/types/planner/market/market";
import { SplCardDetails } from "@/types/splCardDetails";
import { SplMarketCardData } from "@/types/splMarketCardData copy";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { force } = await req.json();
    console.log("Force refresh:", force);
    const cardDetails = await getCachedCardDetailsData(force);
    const cardMarket = await getCachedMarketCardData(force);
    const landMarket = await getCachedMarketLandData(force);

    const lowestCardPrices = getLowestCardPriceList(cardDetails, cardMarket);
    const lowestDeedPrices = getLowestDeedPriceList(landMarket);

    const lowestMarketData = {
      ...lowestCardPrices,
      ...lowestDeedPrices,
    };

    return NextResponse.json({ lowestMarketData }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    const isNotFound = message.toLowerCase().includes("not found");
    return NextResponse.json(
      { error: message },
      { status: isNotFound ? 404 : 501 },
    );
  }
}

export function getLowestCardPriceList(
  cardDetails: SplCardDetails[],
  cards: SplMarketCardData[],
): LowestCardPriceEntry[] {
  const map = new Map<string, LowestCardPriceEntry>();
  for (const card of cards) {
    const rarity = findCardRarity(cardDetails, card.card_detail_id);
    const element = findCardElement(cardDetails, card.card_detail_id);
    console.log("Element", element);
    const set = findCardSet(cardDetails, card.card_detail_id);
    const foil = card.foil;
    const key = `${rarity}|${element}|${foil}|${set}`;
    if (
      !map.has(key) ||
      card.low_price_bcx < (map.get(key)?.low_price_bcx ?? Infinity)
    ) {
      map.set(key, {
        rarity,
        element,
        foil,
        set,
        low_price_bcx: card.low_price_bcx,
        card_detail_id: card.card_detail_id,
      });
    }
  }
  return Array.from(map.values());
}

// Deeds
export function getLowestDeedPriceList(deeds: Deed[]): LowestDeedPriceEntry[] {
  const map = new Map<string, LowestDeedPriceEntry>();
  for (const deed of deeds) {
    const rarity = deed.rarity as PlotRarity;
    const status = deed.plot_status as PlotStatus;
    const terrain = deed.deed_type as DeedType;
    const price = Number(deed.listing_price ?? 0);
    const key = `${rarity}|${status}|${terrain}`;
    if (!map.has(key) || price < (map.get(key)?.listing_price ?? Infinity)) {
      map.set(key, {
        rarity,
        status,
        terrain,
        listing_price: price,
        deed_uid: deed.deed_uid,
      });
    }
  }
  return Array.from(map.values());
}
