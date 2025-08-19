export type SplCardDetails = {
  id: number;
  name: string;
  color: string;
  type: string;
  sub_type: string;
  rarity: number;
  is_starter: false;
  editions: string;
  is_promo: boolean;
  tier?: number;
  secondary_color?: string;
};
