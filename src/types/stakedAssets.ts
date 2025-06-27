export type StakedAssets = {
  cards?: Card[];
  items?: Item[];
};

export type Item = {
  uid: string;
  item_detail_id: number;
  player: string;
  stake_start_date: string;
  stake_type_uid: string;
  stake_ref_uid: string;
  stake_ref_id: string;
  name: string;
  boost: number;
};

export type Card = {
  uid: string;
  card_detail_id: number;
  player: string;
  bcx: number;
  gold: boolean;
  foil: number;
  edition: number;
  card_set: string;
  delegated_to: string;
  rental_type: string;
  collection_power: number;
  land_base_pp: string;
  land_dec_stake_needed: number;
  name: string;
  stake_start_date: string;
  slot: number;
  stake_type_uid: string;
  stake_ref_uid: string;
  base_pp_after_cap: string;
  base_pp_after_cap_percentage: string;
  total_construction_pp: string;
  terrain_boost: string;
  terrain_boost_pp: string;
  dec_stake_needed: number;
  deed_rarity_boost: string;
  deed_rarity_boost_pp: string;
  deed_status_token_boost: string;
  deed_status_token_boost_pp: string;
  runi_boost: string;
  runi_boost_pp: string;
  title_boost: string;
  title_boost_pp: string;
  totem_boost: string;
  totem_boost_pp: string;
  boost: string;
  boost_pp: string;
  total_harvest_pp: string;
  work_per_hour: string;
  is_powered: boolean;
};
