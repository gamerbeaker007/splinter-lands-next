export type CardPPResult = {
  basePPList: GroupedCardRow[];
  ratioPPList: GroupedCardRow[];
};

export type GroupedCardRow = {
  uid: string; // unique id of first card in group
  card_detail_id: number;
  set: string;
  name: string;
  rarity: string;
  edition: number;
  bcx: number;
  foil: number;
  base_pp: number;
  land_dec_stake_needed: number;
  ratio: number; // base_pp / land_dec_stake_needed
  count: number; // how many identical (detail_id, bcx, foil)
};
