import { Resource } from "@/constants/resource/resource";

export interface RegionSummary {
  region_uid: string | number;
  resource: Resource;
  totalBasePP: number;
  totalBoostedPP: number;
  countPlots: Record<Resource, number>;
  production: Record<Resource, number>;
  consumption: Record<Resource, number>;
  netResource: Record<Resource, number>;
  netAdjustedResource: Record<Resource, number>; //resource after tax and tranfer fees
}

export interface RegionTaxSummary {
  region_uid: string;
  tract_number: number;
  type: string;
  capture_rate: number;
  total_tax_dec: number;
  resources: Record<string, string | number>[];
}

export interface RegionTotals {
  dec: Record<Resource, number>;
  totalDEC: number;
  netAdjustedResource: Record<Resource, number>;
  resourceCounts: Record<Resource, number>;
}

export type PlayerRegionDataType = {
  regionSummary: RegionSummary[];
  totals: RegionTotals;
};
