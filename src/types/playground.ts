// Optimized types for playground to reduce data transfer

import { Resource } from "@/constants/resource/resource";
import { PlayerLandCard } from "./playerLandCard";
import {
  DeedType,
  MagicType,
  PlotRarity,
  PlotStatus,
  RuniTier,
  SlotInput,
  TitleTier,
  TotemTier,
  WorksiteType,
} from "./planner";

/**
 * Re-exported for back-compat. New code should import {@link PlayerLandCard}
 * from `@/types/playerLandCard` directly — it is feature-neutral and outlives
 * the Playground.
 */
export type { PlayerLandCard };

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
  isConstruction: boolean;
  runi: RuniTier | null;
  titleTier: TitleTier | null;
  totemTier: TotemTier | null;
  worker1Uid: SlotInput | null;
  worker2Uid: SlotInput | null;
  worker3Uid: SlotInput | null;
  worker4Uid: SlotInput | null;
  worker5Uid: SlotInput | null;
};

export type PlaygroundData = {
  deeds: PlaygroundDeed[];
  cards: PlayerLandCard[];
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
  underConstruction: boolean;
  developed: boolean;
  maxWorkers: number | null;
};

export type WorkerMovement = {
  cardUid: string;
  fromPlot: string;
  toPlot: string;
  hasCooldown: boolean;
};
