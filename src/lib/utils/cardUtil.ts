import { WEB_URL } from "@/lib/shared/statics_icon_urls";
import {
  CardElement,
  cardElementColorMap,
  CardRarity,
  cardRarityOptions,
  CardSetName,
  editionAliasById,
  editionIdByName,
  EditionName,
  editionNameById,
} from "@/types/planner";
import { SplCardDetails } from "@/types/splCardDetails";

// ----------------------------------
// Types
// ----------------------------------

export type FoilBCXType = "normal" | "gold";
export type SetName = "alpha" | "beta" | "default";

type FoilMeta = {
  bcxType: FoilBCXType;
  suffix: string;
  label: string;
};

// ----------------------------------
// Foil Metadata Map
// ----------------------------------

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

export function getEditionId(name: EditionName): number {
  return editionIdByName[name];
}

export function getEditionName(id: number): EditionName | undefined {
  return editionAliasById[id] ?? editionNameById[id];
}

export function getCardImg(
  cardName: string,
  edition: number,
  foil: number,
  level?: number,
): string {
  const suffix = getFoilSuffix(foil);
  const baseCardUrl = `${WEB_URL}cards_by_level`;
  const editionName = getEditionName(edition);
  const safeCardName = encodeURIComponent(cardName.trim());
  const lvl = level && level > 1 ? level : 1;
  return `${baseCardUrl}/${editionName}/${safeCardName}_lv${lvl}${suffix}.png`;
}

export const determineCardMaxBCX = (
  cardSet: string,
  rarity: CardRarity,
  foil: number,
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
  cardDetails: SplCardDetails[] | null | undefined,
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
  actualBcx: number,
) {
  const maxBCX = determineCardMaxBCX(set, rarity, foilId);
  return Math.min(actualBcx, maxBCX);
}

export function findCardRarity(
  cardDetails: SplCardDetails[],
  cardDetailId: number,
): CardRarity {
  const splCard = cardDetails.find((cd) => cd.id === cardDetailId);
  return cardRarityOptions[(splCard?.rarity ?? 1) - 1];
}

export function findCardElement(
  cardDetails: SplCardDetails[],
  cardDetailId: number,
): CardElement {
  const splCard = cardDetails.find((cd) => cd.id === cardDetailId);
  const color = splCard?.color.toLowerCase() ?? "red";
  return cardElementColorMap[color];
}

export function findCardSet(
  cardDetails: SplCardDetails[],
  cardDetailId: number,
): CardSetName {
  const splCard = cardDetails.find((cd) => cd.id === cardDetailId);
  return getEditionName(splCard?.tier ?? 0) as CardSetName;
}
