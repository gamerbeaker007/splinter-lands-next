import {
  CardElement,
  CardRarity,
  DeedType,
  MagicType,
  PlotRarity,
  PlotStatus,
  WorksiteType,
} from "./planner";

export type TerrainCardInfo = {
  uid: string;
  terrainBoost: number;
  element: CardElement;
  rarity: CardRarity;
  bcx: number;
  maxBcx: number;
  basePP: number;
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
  basePP: number;
  boostPP: number;
  worksiteType?: WorksiteType;
  rationingLite: number;
};

export type CountAlert = {
  deedInfo: DeedInfo;
  assignedCards: number;
};

export type NegativeDecAlert = {
  deedInfo: DeedInfo;
  negativeDecPerHour: number;
};

export type BoostCategory = "negative" | "zeroNeutral" | "zeroNonNeutral";

export type TerrainBoostAlerts = Record<BoostCategory, TerrainCardInfo[]>;

/** Owned titles / totems of one kind (e.g. "Common Totem") not staked on a plot. */
export type UnassignedStakeItem = {
  name: string;
  count: number;
};

/**
 * Alerts on the player's land stake items (inventory / balance), as opposed to
 * the card and deed checks: owned but not working on any plot.
 */
export type StakeItemAlerts = {
  unusedPowerCores: number;
  unassignedTitles: UnassignedStakeItem[];
  unassignedTotems: UnassignedStakeItem[];
};

/** Player dashboard checks: staked cards, deed state and stake items. */
export type PlayerAlerts = {
  assignedWorkersAlerts: CountAlert[];
  noWorkersAlerts: DeedInfo[];
  terrainBoostAlerts: TerrainBoostAlerts;
  negativeDECNaturalResourceDeeds: NegativeDecAlert[];
  negativeDECOtherResourceDeeds: NegativeDecAlert[];
  tooMuchBasePP: DeedInfo[];
  noPowerSource: DeedInfo[];
  powerCoreWhileEnergized: DeedInfo[];
  missingBloodLineBoost: DeedInfo[];
  rationingLiteAlerts: DeedInfo[];
  stakeItems: StakeItemAlerts;
};
