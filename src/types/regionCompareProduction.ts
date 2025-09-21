import { Resource } from "@/constants/resource/resource";
import { PlotRarity } from "./planner";
import { ProductionPoints } from "./productionPoints";

export type CompareProductionPoint = {
  method: "plot" | "tract" | "region";
  totalPP: {
    rawPP: number;
    boostedPP: number;
  };
  perResource: Record<string, Record<string, ProductionPoints>>;
};

export type RarityResourceSummary = {
  [rarity in PlotRarity]?: {
    production: { [resource in Resource]?: number };
    consumption: { [resource in Resource]?: number };
  };
};
