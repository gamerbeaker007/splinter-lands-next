import { Resource } from "@/constants/resource/resource";
import { CardSetNameLandValid } from "../editions";
import {
  CardBloodline,
  CardElement,
  CardFoil,
  CardRarity,
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
  set: CardSetNameLandValid;
  /**
   * Verico is not a real set: it is edition 21 within the land set. This flag
   * marks a land slot as a Verico card (visual only). When set, boosts are
   * derived from the representative Verico card detail (id 1001) and the rarity
   * is locked to common.
   */
  isVerico?: boolean;
  rarity: CardRarity;
  bcx: number; // 0..400
  foil: CardFoil;
  element: CardElement;
  /** Secondary element for dual-element cards; used to take the best terrain boost. */
  secondaryElement?: CardElement | null;
  bloodline: CardBloodline;
  landBoosts?: LandBoost;
  uid?: string; // Optional: card UID for playground tracking
  name?: string; // Optional: card name for playground tracking
}

export interface LandBoost {
  produceBoost: Record<Resource, number>;
  consumeGrainDiscount: number;
  liteConsumeGrainDiscount: number;
  bloodlineBoost: number;
  decDiscount: number;
  replacePowerCore: boolean;
  laborLuck: boolean;
}

export interface SlotComputedPP {
  basePP: number;
  boostedPP: number;
  isCapped?: boolean;
}
