import { WEB_URL } from "@/lib/shared/statics_icon_urls";
import { Rarity } from "@/types/rarity";
import { SplCardDetails } from "@/types/splCardDetails";

type FoilType = "normal" | "gold";
type SetName = "alpha" | "beta" | "default";

const bcxMap: Record<FoilType, Record<SetName, Record<Rarity, number>>> = {
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

export const determineCardMaxBCX = (
  card_set: string,
  rarity: Rarity,
  foil: number,
): number => {
  console.log(`cardset: `, card_set);
  const foilType: FoilType = foil > 0 ? "gold" : "normal";
  const set: SetName =
    card_set in bcxMap[foilType] ? (card_set as SetName) : "default";

  return bcxMap[foilType][set][rarity];
};

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

export const RarityColor: Record<string, string> = {
  Common: "gray",
  Rare: "blue",
  Epic: "purple",
  Legendary: "gold",
};

export function getEditionName(edition: Edition): string {
  return Edition[edition];
}

function getFoilSuffix(foil: number): string {
  switch (foil) {
    case 1:
    case 2:
      return "_gold";
    case 3:
      return "_blk";
    case 0:
    default:
      return "";
  }
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

export function determineCardInfo(
  id: number,
  cardDetails: SplCardDetails[] | null | undefined,
) {
  if (!cardDetails || !Array.isArray(cardDetails)) {
    console.warn("cardDetails is null or not an array");
    return { name: "", edition: "", rarity: "", max_bcx: 0 };
  }

  const card = cardDetails.find((cd) => cd.id === id);
  if (!card) {
    console.warn(`Card with id ${id} not found`);
    return { name: "", edition: "", rarity: "", max_bcx: 0 };
  }

  const name = card.name;
  const rarity = rarityName(card.rarity);
  return { name, rarity };
}

function rarityName(rarity: number) {
  switch (rarity) {
    case 1:
      return "Common";
    case 2:
      return "Rare";
    case 3:
      return "Epic";
    case 4:
      return "Legendary";
    default:
      return `Unknown (${rarity})`;
  }
}

export const getFoilLabel = (foil: number): string => {
  switch (foil) {
    case 0:
      return "Regular";
    case 1:
      return "Gold";
    case 2:
      return "Gold Arcane";
    case 3:
      return "Black Foil";
    case 4:
      return "Black Arcane";
    default:
      return "Unknown";
  }
};
