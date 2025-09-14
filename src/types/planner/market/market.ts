import {
  CardRarity,
  CardElement,
  CardSetName,
  PlotRarity,
  PlotStatus,
  DeedType,
  CardFoil,
  TitleTier,
  TotemRarity,
} from "../primitives";

export type LowestCardPriceKey = {
  rarity: CardRarity;
  element: CardElement;
  foil: CardFoil;
  set: CardSetName;
};

export type LowestTitlePriceKey = {
  rarity: Exclude<TitleTier, "none">;
};

export type LowestDeedPriceKey = {
  rarity: PlotRarity;
  status: PlotStatus;
  deedType: DeedType;
};

export type LowestCardPriceEntry = LowestCardPriceKey & {
  low_price_bcx: number;
  card_detail_id: number;
  name: string;
};

export type LowestDeedPriceEntry = LowestDeedPriceKey & {
  listing_price: number;
  deed_uid: string;
};

export type LowestTotemPriceEntry = {
  listing_price: number;
  rarity: TotemRarity;
};

export type LowestTitlePriceEntry = LowestTitlePriceKey & {
  listing_price: number;
  titleName: string;
};

export type LowestMarketData = {
  lowestCardPrices: LowestCardPriceEntry[];
  lowestDeedPrices: LowestDeedPriceEntry[];
  lowestTitlePrices?: LowestTitlePriceEntry[];
  lowestTotemPrices?: LowestTotemPriceEntry[];
};

export const assetOptions = [
  "PACKS",
  "LAND",
  "TOTEMS",
  "TITLES",
  "DEEDS",
  "LAND_RESOURCES",
  "TOTEM_ITEMS",
  "TOTEM_FRAGMENTS",
  "AVATARS",
  "CONSUMABLES",
];
export type Assets = (typeof assetOptions)[number];

export const titleTierMap: Record<string, TitleTier> = {
  // 10% bonus (rare)
  "The Legionnaire": "rare",
  "The Watcher": "rare",
  "The Scorcher": "rare",
  "The Proven": "rare",
  "The Saga Seeker": "rare",
  "The Mystic": "rare",
  "The Rebel": "rare",

  // 25% bonus (epic)
  "The Gambler": "epic",
  "The Explorer": "epic",
  "The Incinerator": "epic",
  "The Defiant": "epic",
  "The Tower Mage": "epic",
  "The Veteran": "epic",
  "The Fable Scout": "epic",
  "The Emissary": "epic",
  "The Enigma": "epic",

  // 50% bonus (legendary)
  "The Untamed": "legendary",
  "The Praetorian": "legendary",
  "The High Roller": "legendary",
  "The Burninator": "legendary",
  "The Grandmaster": "legendary",
  "The Dawnbringer": "legendary",
  "The Renowned": "legendary",
  "The Arcane": "legendary",
  "The Myth Hunter": "legendary",
  "Custom Titles": "legendary",
};
