import { ProductionPoints } from "@/types/productionPoints";

export type RegionResourcePP = {
  totalPP: ProductionPoints;
  // Split by Region UID
  perRegion: Record<string, ProductionPoints>;
};

// Total production points for a region
export type RegionPP = {
  totalPP: ProductionPoints;
  // Split by resource name, e.g., "GRAIN", "WOOD"
  perResource: Record<string, RegionResourcePP>;
};
