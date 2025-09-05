import {
  CardElement,
  DeedType,
  MagicType,
  PlotStatus,
  PlotRarity,
  WorksiteType,
} from "./planner";

export type TerrainCardInfo = {
  terrainBoost: number;
  element: CardElement;
  cardDetailId: number;
  cardName: string;
  edition: number;
  foil: number;
  deedInfo: DeedInfo;
};

export type DeedInfo = {
  plotId: number;
  plotNumber: number;
  regionNumber: number;
  regionName: string;
  tractNumber: number;
  territory: string;
  deedType: DeedType;
  magicType: MagicType;
  plotStatus: PlotStatus;
  rarity: PlotRarity;
  worksiteType?: WorksiteType;
};

export type CountAlert = {
  deedInfo: DeedInfo;
  assignedCards: number;
};

export type BoostCategory = "negative" | "zeroNeutral" | "zeroNonNeutral";

export type TerrainBoostAlerts = Record<BoostCategory, TerrainCardInfo[]>;

export type CardAlerts = {
  assignedWorkersAlerts: CountAlert[];
  noWorkersAlerts: DeedInfo[];
  terrainBoostAlerts: TerrainBoostAlerts;
};
