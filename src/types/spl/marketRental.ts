export interface SplMarketRentGrouped {
  card_detail_id: number;
  gold: boolean;
  foil: number;
  edition: number;
  qty: number;
  level: number;
  low_price_bcx: number;
  low_price: number;
  high_price: number;
  mana: number;
  season_qty: number;
  daily_qty: number;
}

export type SplMarketRentalType = "season" | "daily";
export type SplMarketType = "SELL" | "RENT";

export interface SplMarketListing {
  market_id: string;
  card_id: string;
  uid: string;
  card_detail_id: number;
  edition: number;
  foil: number;
  gold: boolean;
  level: number;
  bcx: number;
  xp: number;
  buy_price: number;
  price_bcx: number;
  fee_percent: number;
  seller: string;
  type: SplMarketType;
  rental_type: SplMarketRentalType;
  expiration_date: string;
  currency: string;
  land_base_pp: string;
}
