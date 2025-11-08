import { Resource } from "@/constants/resource/resource";
import {
  CardBloodline,
  CardElement,
  CardFoil,
  CardRarity,
  CardSetName,
  DeedType,
  MagicType,
  PlotRarity,
  PlotStatus,
  RuniTier,
  TitleTier,
  TotemTier,
  WorksiteType,
} from "./primitives";

export interface PlotPlannerData {
  plotRarity: PlotRarity;
  deedType: DeedType;
  magicType: MagicType;
  plotStatus: PlotStatus;
  title: TitleTier;
  totem: TotemTier;
  runi: RuniTier;
  worksiteType: WorksiteType;
  regionNumber: number;
  tractNumber: number;
  cardInput: SlotInput[]; // set of card ids in the planner
}

export interface SlotInput {
  id: number;
  set: CardSetName;
  rarity: CardRarity;
  bcx: number; // 0..400
  foil: CardFoil;
  element: CardElement;
  bloodline: CardBloodline;
  landBoosts?: LandBoost;
}

export interface LandBoost {
  produceBoost: Record<Resource, number>;
  consumeGrainDiscount: number;
  bloodlineBoost: Record<CardBloodline, number>;
  decDiscount: number;
  replacePowerCore: boolean;
  laborLuck: boolean;
}

export interface SlotComputedPP {
  basePP: number;
  boostedPP: number;
}
