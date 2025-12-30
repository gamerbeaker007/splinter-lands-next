// Optimized types for playground to reduce data transfer

import { Resource } from "@/constants/resource/resource";
import { CardSetName } from "./editions";
import {
  CardElement,
  CardFoil,
  CardRarity,
  DeedType,
  LandBoost,
  MagicType,
  PlotRarity,
  PlotStatus,
  RuniTier,
  SlotInput,
  TitleTier,
  TotemTier,
  WorksiteType,
} from "./planner";

export type PlaygroundDeed = {
  deed_uid: string;
  region_number: number;
  tract_number: number;
  plot_number: number;
  plot_id: number;
  rarity: PlotRarity;
  plotStatus: PlotStatus;
  magicType: MagicType | null;
  resource: Resource;
  deedType: DeedType;
  worksiteType: WorksiteType;
  basePP: number;
  boostedPP: number;
  runi: RuniTier | null;
  titleTier: TitleTier | null;
  totemTier: TotemTier | null;
  worker1Uid: SlotInput | null;
  worker2Uid: SlotInput | null;
  worker3Uid: SlotInput | null;
  worker4Uid: SlotInput | null;
  worker5Uid: SlotInput | null;
};

export type PlaygroundCard = {
  uid: string;
  cardDetailId: number;
  name: string;
  edition: number;
  set: CardSetName;
  rarity: CardRarity;
  element: CardElement;
  subElement: CardElement;
  landBasePP: number;
  lastUsedDate: string | null;
  bcx: number;
  bcxUnbound: number;
  foil: CardFoil;
  level: number;
  landBoost: LandBoost | null;
  inSet: boolean;
  onWagon: boolean;
};

export type PlaygroundData = {
  deeds: PlaygroundDeed[];
  cards: PlaygroundCard[];
  totalBoostedPP: number;
};

export type DeedChange = {
  deed_uid: string;
  field:
    | "worksite"
    | "runi"
    | "title"
    | "totem"
    | "worker1"
    | "worker2"
    | "worker3"
    | "worker4"
    | "worker5";
  oldValue: number | string | SlotInput | null;
  newValue: number | string | SlotInput | null;
  timestamp: Date;
};

export type DeedFilterOptions = {
  regions: number[];
  tracts: number[];
  plots: number[];
  rarities: PlotRarity[];
  statuses: PlotStatus[];
  terrains: DeedType[];
  worksites: WorksiteType[];
};
