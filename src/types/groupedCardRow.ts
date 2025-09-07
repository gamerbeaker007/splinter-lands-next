export type GroupedCardRow = {
  uid: string; // unique id of first card in group usesd for runi
  card_detail_id: number;
  set: string;
  name: string;
  level: number;
  rarity: string;
  edition: number;
  bcx: number;
  foil: number;
  basePP: number;
  landDecStakeNeeded: number;
  ratio: number; // base_pp / land_dec_stake_needed
  count: number; // how many identical (detail_id, bcx, foil)
};
