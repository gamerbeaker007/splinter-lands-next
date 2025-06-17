import { WEB_URL } from "@/scripts/statics_icon_urls";
import { Rarity } from "@/types/rarity";
import { SplCardDetails } from "@/types/splCardDetails";

export function determineCardMaxBCX(
  id: number,
  edition: number,
  rarity: Rarity,
  foil: number,
): number | string {
  if (edition === 0) return getAlphaBCX(foil, rarity);
  if (edition === 1) return getBetaBCX(foil, rarity);
  if (edition === 2) return getEditionPromoBCX(id, foil, rarity);
  if (edition === 3) return getEditionRewardBCX(id, foil, rarity);

  return getDefaultBCX(foil, rarity);
}

function getAlphaBCX(foil: number, rarity: Rarity) {
  if (foil === 0) {
    return { Common: 397, Rare: 86, Epic: 32, Legendary: 8 }[rarity];
  } else {
    return { Common: 31, Rare: 17, Epic: 8, Legendary: 3 }[rarity];
  }
}

function getBetaBCX(foil: number, rarity: Rarity) {
  if (foil === 0) {
    return { Common: 505, Rare: 115, Epic: 46, Legendary: 11 }[rarity];
  } else {
    return { Common: 38, Rare: 22, Epic: 10, Legendary: 4 }[rarity];
  }
}

function getDefaultBCX(foil: number, rarity: Rarity) {
  if (foil === 0) {
    // Foil Regular
    return { Common: 400, Rare: 115, Epic: 46, Legendary: 11 }[rarity];
  } else {
    // Foil 1 Gold
    // Foil 2 GoldArcane
    // Foil 3 Black Foil
    // Foil 4 Black Arcane
    return { Common: 38, Rare: 22, Epic: 10, Legendary: 4 }[rarity];
  }
}

function getEditionPromoBCX(
  id: number,
  foil: number,
  rarity: Rarity,
): number | string {
  if (id >= 75 && id <= 78) {
    return getAlphaBCX(foil, rarity);
  }
  if (id > 223) {
    return getDefaultBCX(foil, rarity);
  }
  //TODO Beta promo. For now assume Beta.
  return getBetaBCX(foil, rarity);
}

function getEditionRewardBCX(
  id: number,
  foil: number,
  rarity: Rarity,
): number | string {
  if (id > 223) {
    return getDefaultBCX(foil, rarity);
  }

  //TODO Beta reward. For now assume Beta.
  return getBetaBCX(foil, rarity);
}

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
