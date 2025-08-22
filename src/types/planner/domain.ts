import {
  CardElement as CardElement,
  CardFoil,
  CardRarity,
  CardSetName,
  DeedType,
  PlotRarity,
  PlotStatus,
  RuniTier,
  TitleTier,
  TotemTier,
} from "./primitives";

export interface PlotModifiers {
  plotRarity: PlotRarity;
  deedType: DeedType;
  plotStatus: PlotStatus;
  title: TitleTier;
  totem: TotemTier;
  runi: RuniTier;
}

export interface SlotInput {
  id: number;
  set: CardSetName;
  rarity: CardRarity;
  bcx: number; // 0..400
  foil: CardFoil;
  element: CardElement;
}

export interface SlotComputedPP {
  basePP: number;
  boostedPP: number;
}

// export interface Totals {
//   totalBasePP: number;
//   totalBoostedPP: number;
// }
