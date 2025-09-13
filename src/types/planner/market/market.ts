import {
  CardRarity,
  CardElement,
  CardSetName,
  PlotRarity,
  PlotStatus,
  DeedType,
} from "../primitives";

export type LowestCardPriceKey = {
  rarity: CardRarity;
  element: CardElement;
  foil: boolean;
  set: CardSetName;
};

export type LowestDeedPriceKey = {
  rarity: PlotRarity;
  status: PlotStatus;
  terrain: DeedType;
};

export type LowestCardPriceEntry = LowestCardPriceKey & {
  low_price_bcx: number;
  card_detail_id: number;
};

export type LowestDeedPriceEntry = LowestDeedPriceKey & {
  listing_price: number;
  deed_uid: string;
};

export type LowestMarketData = LowestCardPriceEntry[] & LowestDeedPriceEntry[];
