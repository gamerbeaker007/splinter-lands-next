export type CardPPResult = {
  top100BasePP: GroupedCardRow[];
  top100PPRatio: GroupedCardRow[];
};

export type GroupedCardRow = {
  card_detail_id: number;
  bcx: number;
  foil: number;
  base_pp: number; // per-card base PP (parsed from string)
  land_dec_stake_needed: number; // per-card stake DEC
  ratio: number; // base_pp / land_dec_stake_needed
  count: number; // how many identical (detail_id, bcx, foil)
};
