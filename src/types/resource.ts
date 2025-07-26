export interface RegionSummary {
  region_uid: string | number;
  [key: string]: string | number;
}

export interface RegionTaxSummary {
  region_uid: string;
  tract_number: number;
  type: string;
  capture_rate: number;
  total_tax_dec: number;
  resources: Record<string, string | number>[];
}

export type PlayerRegionDataType = {
  regionSummary: RegionSummary[];
  totals: Record<string, number>;
};
