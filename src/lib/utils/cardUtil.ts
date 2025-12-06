import { WEB_URL } from "@/lib/shared/statics_icon_urls";
import { CardSetNameLandValid, editionMap } from "@/types/editions";
import {
  CardElement,
  cardElementColorMap,
  CardFoil,
  cardFoilSuffixMap,
  CardRarity,
  cardRarityOptions,
} from "@/types/planner";
import { SplCardDetails } from "@/types/splCardDetails";

// ----------------------------------
// Types
// ----------------------------------

type FoilBCXType = "normal" | "gold";
type SetName = "alpha" | "beta" | "default";

type FoilMeta = {
  bcxType: FoilBCXType;
  suffix: string;
  label: string;
};

// ----------------------------------
// Foil Metadata Map
// ----------------------------------

/**
 * @deprecated remove when possible.
 */
const foilMetaMap: Record<number, FoilMeta> = {
  0: { bcxType: "normal", suffix: "", label: "Regular" },
  1: { bcxType: "gold", suffix: "_gold", label: "Gold" },
  2: { bcxType: "gold", suffix: "_gold", label: "Gold Arcane" },
  3: { bcxType: "gold", suffix: "_blk", label: "Black Foil" },
  4: { bcxType: "gold", suffix: "_blk", label: "Black Arcane" },
};

// ----------------------------------
// BCX Map
// ----------------------------------

const bcxMap: Record<
  FoilBCXType,
  Record<SetName, Record<CardRarity, number>>
> = {
  normal: {
    alpha: { common: 379, rare: 86, epic: 32, legendary: 8 },
    beta: { common: 505, rare: 115, epic: 46, legendary: 11 },
    default: { common: 400, rare: 115, epic: 46, legendary: 11 },
  },
  gold: {
    alpha: { common: 31, rare: 17, epic: 8, legendary: 3 },
    beta: { common: 38, rare: 22, epic: 10, legendary: 4 },
    default: { common: 38, rare: 22, epic: 10, legendary: 4 },
  },
};

// ----------------------------------
// Utilities
// ----------------------------------

const getFoilSuffix = (foil: number): string => foilMetaMap[foil]?.suffix ?? "";

const getFoilType = (foil: number): FoilBCXType =>
  foilMetaMap[foil]?.bcxType ?? "normal";

/**
 * @deprecated Use getCardImgV2 instead.
 */
export function getCardImg(
  cardName: string,
  edition: number,
  foil: number,
  level?: number
): string {
  const suffix = getFoilSuffix(foil);
  const baseCardUrl = `${WEB_URL}cards_by_level`;
  const editionName = editionMap[edition]?.urlName || "default";
  const safeCardName = encodeURIComponent(cardName.trim());
  const lvl = level && level > 1 ? level : 1;
  return `${baseCardUrl}/${editionName}/${safeCardName}_lv${lvl}${suffix}.png`;
}

// New version using Edition and CardFoil types from primitives.ts
export function getCardImgV2(
  cardName: string,
  edition: number,
  foil: CardFoil,
  level?: number
): string {
  const suffix = cardFoilSuffixMap[foil];
  const baseCardUrl = `${WEB_URL}cards_by_level`;
  const safeCardName = encodeURIComponent(cardName.trim());
  const editionUrl = editionMap[edition]?.urlName || "default";
  const lvl = level && level > 1 ? level : 1;
  return `${baseCardUrl}/${editionUrl}/${safeCardName}_lv${lvl}${suffix}.png`;
}

export const determineCardMaxBCX = (
  cardSet: string,
  rarity: CardRarity,
  foil: number
): number => {
  const foilType = getFoilType(foil);
  const validSets: SetName[] = ["alpha", "beta", "default"];
  const set: SetName = validSets.includes(cardSet as SetName)
    ? (cardSet as SetName)
    : "default";

  return bcxMap[foilType][set][rarity];
};

function rarityName(rarity: number): CardRarity | string {
  return cardRarityOptions[rarity - 1] ?? `Unknown (${rarity})`;
}

export function determineCardInfo(
  id: number,
  cardDetails: SplCardDetails[] | null | undefined
): {
  name: string;
  rarity: CardRarity;
} {
  if (!Array.isArray(cardDetails)) {
    console.warn("cardDetails is null or not an array");
    return { name: "", rarity: "" };
  }

  const card = cardDetails.find((cd) => cd.id === id);
  if (!card) {
    console.warn(`Card with id ${id} not found`);
    return { name: "", rarity: "" };
  }

  const name = card.name;
  const rarity = rarityName(card.rarity);

  return { name, rarity };
}

export function determineBcxCap(
  set: string,
  rarity: CardRarity,
  foilId: number,
  actualBcx: number
) {
  const maxBCX = determineCardMaxBCX(set, rarity, foilId);
  return Math.min(actualBcx, maxBCX);
}

export function findCardRarity(
  cardDetails: SplCardDetails[],
  cardDetailId: number
): CardRarity {
  const splCard = cardDetails.find((cd) => cd.id === cardDetailId);
  return cardRarityOptions[(splCard?.rarity ?? 1) - 1];
}

export function findCardElement(
  cardDetails: SplCardDetails[],
  cardDetailId: number
): CardElement {
  const splCard = cardDetails.find((cd) => cd.id === cardDetailId);
  const color = splCard?.color.toLowerCase() ?? "red";
  return cardElementColorMap[color];
}

export function findCardSet(
  cardDetails: SplCardDetails[],
  cardDetailId: number,
  edition: number
): CardSetNameLandValid {
  const ALPHA_MAX_PROMO_ID = 79;

  const splCard = cardDetails.find((cd) => cd.id === cardDetailId);

  // 1) If tier exists, it wins.
  if (splCard?.tier != null) {
    return editionMap[splCard.tier].setName as CardSetNameLandValid;
  }

  // 2) Tier is missing → fall back to edition-based rules.
  //    - edition 3 → beta
  if (edition === 3) return "beta";

  //    - edition > 3 → use edition mapping (e.g., untamed/chaos/etc.)
  if (edition > 3) return editionMap[edition].setName as CardSetNameLandValid;

  //    - edition 2 → alpha if id <= 79 else beta
  if (edition === 2) {
    return cardDetailId <= ALPHA_MAX_PROMO_ID ? "alpha" : "beta";
  }

  // 3) Last resort: map by edition (covers any remaining edge cases)
  return editionMap[edition].setName as CardSetNameLandValid;
}

export function findCardEditionNameByName(
  cardDetails: SplCardDetails[],
  cardName: string,
  set: CardSetNameLandValid
): string {
  const splCard = cardDetails.find((cd) => cd.name === cardName);
  const editionArray = splCard?.editions.split(",") ?? [];
  if (editionArray.length > 1) {
    //multiple editions assume alpha beta return set
    return set as string;
  } else {
    return editionMap[Number(editionArray[0])].urlName as string;
  }
}
