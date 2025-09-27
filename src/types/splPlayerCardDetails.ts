export type SplPlayerCardCollection = {
  player: string;
  uid: string;
  card_detail_id: number;
  xp: number;
  edition: number;
  card_set: string;
  collection_power: number;
  alpha_xp: number;
  lock_days: number;
  unlock_date?: string;
  wagon_uid?: string;
  stake_ref_uid: string;
  stake_start_date: Date;
  stake_end_date?: string;
  stake_plot: number;
  stake_region: number;
  bcx: number;
  land_base_pp: number;
  land_dec_stake_needed: number;
  set_id?: string;
  bcx_unbound: number;
  survival_date?: string;
  survival_mode_disabled?: string;
  foil: number;
  mint?: string;
  level: number;
  delegated_to_display_name?: string;
  delegated_to?: string;

  //unused in this app
  //  "gold": boolean,
  //   "market_id"?: string,
  //   "buy_price"?: string,
  //   "market_listing_type"?: string,
  //   "market_listing_status"?: string,
  //   "market_created_date"?: string,
  //   "rental_type"?: string,
  //   "rental_days"?: string,
  //   "rental_date"?: string,
  //   "next_rental_payment"?: string,
  //   "cancel_tx"?: string,
  //   "cancel_date"?: string,
  //   "cancel_player"?: string,
  //   "last_used_block"?: string,
  //   "last_used_player"?: string,
  //   "last_used_date"?: string,
  //   "last_transferred_block": number,
  //   "last_transferred_date": "2023-10-01T08:14:27.000Z",
  //   "delegated_to"?: string,
  //   "delegation_tx": string,
  //   "skin"?: string,
  //   "delegated_to_display_name"?: string,
  //   "display_name": string,
  //   "created_date": "2022-08-07T02:53:54.000Z",
  //   "created_block": number,
  //   "created_tx": string,
  //   "expiration_date"?: string,
  //   "last_buy_price"?: string,
  //   "last_buy_currency"?: string,
  //   "renewal_tx"?: string,
  //   "renewal_date"?: string,
};
