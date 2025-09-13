import {
  CardRarity,
  CardElement,
  CardSetName,
  PlotRarity,
  PlotStatus,
  DeedType,
  CardFoil,
} from "../primitives";

export type LowestCardPriceKey = {
  rarity: CardRarity;
  element: CardElement;
  foil: CardFoil;
  set: CardSetName;
};

export type LowestDeedPriceKey = {
  rarity: PlotRarity;
  status: PlotStatus;
  deedType: DeedType;
};

export type LowestCardPriceEntry = LowestCardPriceKey & {
  low_price_bcx: number;
  card_detail_id: number;
};

export type LowestDeedPriceEntry = LowestDeedPriceKey & {
  listing_price: number;
  deed_uid: string;
};

export type LowestMarketData = {
  lowestCardPrices: LowestCardPriceEntry[];
  lowestDeedPrices: LowestDeedPriceEntry[];
};
