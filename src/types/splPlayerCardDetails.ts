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
  land_base_pp: string; // API returns this as string, but it represents a number
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
  last_used_date?: string;
  rental_days?: number | string | null;
  rental_date?: string;
  rental_type?: string | null;
  buy_price?: string | null;
  market_id?: string | null;
  /** ISO date of the next scheduled rental payment. When this is past the current season end, the rental has already been renewed into the next season. */
  next_rental_payment?: string | null;
  cancel_tx?: string;
  cancel_date?: string;

  //unused in this app
  //  "gold": boolean,
  //   "market_listing_type"?: string,
  //   "market_listing_status"?: string,
  //   "market_created_date"?: string,
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
