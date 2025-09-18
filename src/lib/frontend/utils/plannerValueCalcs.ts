import { PlotModifiers, SlotInput } from "@/types/planner";
import {
  LowestCardPriceEntry,
  LowestDeedPriceEntry,
  LowestTitlePriceEntry,
  LowestTotemPriceEntry,
} from "@/types/planner/market/market";
import { capitalize } from "@mui/material";

export function formatFallbackWarning(
  preferredKeys: string[],
  usedKeys: string[],
) {
  const keyMap: Record<string, string> = {
    deedType: "Geography",
  };

  const dropped = preferredKeys.filter(
    (k, i) => !usedKeys[i] || usedKeys[i].trim() === "",
  );

  if (dropped.length === 0) return null;

  const formattedDropped = dropped
    .map((k) => keyMap[k] ?? k)
    .map((v) => capitalize(v));

  const formattedUsed = usedKeys.filter(Boolean).map((v) => capitalize(v));

  return `Price fallback applied - ${formattedDropped.join(
    ", ",
  )} not available. Now based on: ${formattedUsed.join(" | ")}`;
}
// Helper to find the best match for deed price with fallback
export function findLowestDeedPrice(
  plot: PlotModifiers,
  deedPrices: LowestDeedPriceEntry[],
) {
  if (!deedPrices || deedPrices.length === 0)
    return { price: null, usedKey: null, warning: "No market data." };

  const preferredKeys = ["rarity", "status", "deedType"];
  const keys = [
    {
      rarity: plot.plotRarity,
      status: plot.plotStatus,
      deedType: plot.deedType,
    },
    { rarity: plot.plotRarity, status: plot.plotStatus },
    { rarity: plot.plotRarity, deedType: plot.deedType },
    { status: plot.plotStatus, deedType: plot.deedType },
    { rarity: plot.plotRarity },
    { status: plot.plotStatus },
    { deedType: plot.deedType },
  ];

  for (const keyObj of keys) {
    const match = deedPrices.find((deed) =>
      Object.entries(keyObj).every(
        ([k, v]) => deed[k as keyof LowestDeedPriceEntry] === v,
      ),
    );
    if (match) {
      const usedKeyArr = preferredKeys.map(
        (k) => (keyObj as Record<string, string>)[k],
      );
      const warning = usedKeyArr.every((v) => v)
        ? null
        : formatFallbackWarning(preferredKeys, usedKeyArr);
      return {
        price: match.listing_price,
        usedKey: usedKeyArr.filter(Boolean).join("|"),
        warning,
      };
    }
  }
  return {
    price: null,
    usedKey: null,
    warning: "No matching plot price found.",
  };
}

export function findLowestCardPrice(
  card: SlotInput,
  cardPrices: LowestCardPriceEntry[],
) {
  if (!cardPrices || cardPrices.length === 0)
    return {
      price: null,
      usedKey: null,
      cardInfo: null,
      warning: "No market data.",
    };

  const preferredKeys = ["rarity", "element", "foil", "set"];
  const keys = [
    {
      set: card.set,
      rarity: card.rarity,
      foil: card.foil,
      element: card.element,
    },
    { set: card.set, rarity: card.rarity, foil: card.foil },
    { set: card.set, rarity: card.rarity, element: card.element },
    { set: card.set, rarity: card.rarity },
    { set: card.set },
  ];

  for (const keyObj of keys) {
    const match = cardPrices.find((cardEntry) =>
      Object.entries(keyObj).every(
        ([k, v]) => cardEntry[k as keyof LowestCardPriceEntry] === v,
      ),
    );
    if (match) {
      const usedKeyArr = preferredKeys.map(
        (k) => (keyObj as Record<string, string>)[k],
      );
      const warning = usedKeyArr.every((v) => v)
        ? null
        : formatFallbackWarning(preferredKeys, usedKeyArr);
      return {
        price: match.low_price_bcx * card.bcx,
        cardInfo: {
          id: match.card_detail_id,
          bcx: card.bcx,
          rarity: match.rarity,
          element: match.element,
          foil: match.foil,
          set: match.set,
          name: match.name,
        },
        usedKey: usedKeyArr.filter(Boolean).join("|"),
        warning,
      };
    }
  }
  return {
    price: null,
    cardDetail: null,
    usedKey: null,
    warning: "No matching card price found.",
  };
}

export function findLowestTotemPrice(
  plot: PlotModifiers,
  totemPrices: LowestTotemPriceEntry[],
) {
  if (!totemPrices || totemPrices.length === 0)
    return { price: null, usedKey: null, warning: "No market data." };

  const match = totemPrices.find((totem) => totem.rarity === plot.totem);
  if (match) {
    return {
      price: match.listing_price,
      title: match.rarity,
      usedKey: match.rarity,
      warning: null,
    };
  }
  return {
    price: null,
    title: null,
    usedKey: null,
    warning: "No matching totem price found.",
  };
}

export function findLowestTitlePrice(
  plot: PlotModifiers,
  titlePrices: LowestTitlePriceEntry[],
) {
  if (!titlePrices || titlePrices.length === 0)
    return { price: null, usedKey: null, warning: "No market data." };

  const match = titlePrices.find((title) => title.rarity === plot.title);
  if (match) {
    return {
      price: match.listing_price,
      title: match.titleName,
      usedKey: match.rarity,
      warning: null,
    };
  }
  return {
    price: null,
    usedKey: null,
    title: null,
    warning: "No matching title price found.",
  };
}
