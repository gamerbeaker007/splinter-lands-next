import { WEB_URL } from "@/lib/shared/statics_icon_urls";
import { Rarity } from "@/types/rarity";
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

const bcxMap: Record<FoilBCXType, Record<SetName, Record<Rarity, number>>> = {
  normal: {
    alpha: { Common: 379, Rare: 86, Epic: 32, Legendary: 8 },
    beta: { Common: 505, Rare: 115, Epic: 46, Legendary: 11 },
    default: { Common: 400, Rare: 115, Epic: 46, Legendary: 11 },
  },
  gold: {
    alpha: { Common: 31, Rare: 17, Epic: 8, Legendary: 3 },
    beta: { Common: 38, Rare: 22, Epic: 10, Legendary: 4 },
    default: { Common: 38, Rare: 22, Epic: 10, Legendary: 4 },
  },
};

// ----------------------------------
// Rarity Mapping & Colors
// ----------------------------------

const rarityMap: Record<number, Rarity> = {
  1: "Common",
  2: "Rare",
  3: "Epic",
  4: "Legendary",
};

export const RarityColor: Record<Rarity, string> = {
  Common: "gray",
  Rare: "blue",
  Epic: "purple",
  Legendary: "gold",
};

// ----------------------------------
// Edition Enum
// ----------------------------------

enum Edition {
  alpha = 0,
  beta = 1,
  promo = 2,
  reward = 3,
  untamed = 4,
  dice = 5,
  gladius = 6,
  chaos = 7,
  rift = 8,
  soulbound = 10,
  rebellion = 12,
  soulboundrb = 13,
  conclave = 14,
}

// ----------------------------------
// Utilities
// ----------------------------------

export const getFoilLabel = (foil: number): string =>
  foilMetaMap[foil]?.label ?? "Unknown";

const getFoilSuffix = (foil: number): string => foilMetaMap[foil]?.suffix ?? "";

const getFoilType = (foil: number): FoilBCXType =>
  foilMetaMap[foil]?.bcxType ?? "normal";

export function getEditionName(edition: Edition): string {
  return Edition[edition];
}

export function getCardImg(
  cardName: string,
  edition: Edition,
  foil: number,
): string {
  const suffix = getFoilSuffix(foil);
  const baseCardUrl = `${WEB_URL}cards_by_level`;
  const editionName = getEditionName(edition);
  const safeCardName = encodeURIComponent(cardName.trim());
  return `${baseCardUrl}/${editionName}/${safeCardName}_lv1${suffix}.png`;
}

export const determineCardMaxBCX = (
  cardSet: string,
  rarity: Rarity,
  foil: number,
): number => {
  const foilType = getFoilType(foil);
  const validSets: SetName[] = ["alpha", "beta", "default"];
  const set: SetName = validSets.includes(cardSet as SetName)
    ? (cardSet as SetName)
    : "default";

  return bcxMap[foilType][set][rarity];
};

function rarityName(rarity: number): Rarity | string {
  return rarityMap[rarity] ?? `Unknown (${rarity})`;
}

export function determineCardInfo(
  id: number,
  cardDetails: SplCardDetails[] | null | undefined,
): {
  name: string;
  rarity: Rarity | string;
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
