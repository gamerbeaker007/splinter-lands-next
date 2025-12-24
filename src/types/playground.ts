// Optimized types for playground to reduce data transfer

import { Resource } from "@/constants/resource/resource";
import {
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
} from "./planner";

export type PlaygroundDeed = {
  deed_uid: string;
  region_number: number;
  tract_number: number;
  plot_number: number;
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
  worker1Uid: string | null;
  worker2Uid: string | null;
  worker3Uid: string | null;
  worker4Uid: string | null;
  worker5Uid: string | null;
};

export type PlaygroundCard = {
  uid: string;
  card_detail_id: number;
  name: string;
  rarity: CardRarity;
  land_base_pp: number;
  last_used_date: string | null;
  bcx: number;
  foil: CardFoil;
  level: number;
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
  oldValue: number | string | null;
  newValue: number | string | null;
  timestamp: Date;
};

export type DeedFilterOptions = {
  regions: number[];
  tracts: number[];
  plots: number[];
};
