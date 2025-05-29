export interface RegionTrackingRow {
    region_uid: string | number;
    token_symbol: string;
    rewards_per_hour: number;
    total_harvest_pp: number;
    total_base_pp_after_cap: number;
    count: number;
    cost_per_h_grain?: number;
    cost_per_h_wood?: number;
    cost_per_h_stone?: number;
    cost_per_h_iron?: number;
  }
  
  export interface RegionSummary {
    region_uid: string | number;
    [key: string]: string | number;
  }