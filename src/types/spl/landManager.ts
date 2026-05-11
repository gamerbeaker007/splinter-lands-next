// === Production Overview API ===

export interface SplProductionOverviewPlot {
  rarity: string;
  plot_status: string;
  rarity_count: string;
  active: string;
}

export interface SplProductionOverviewRegion {
  player: string;
  region_uid: string;
  name: string;
  region_number: number;
  plots_owned: number;
  dark_energy_required: number;
  active_worksites: number;
  wood_per_hr: number;
  wood_pp: number;
  wood_worksites: number;
  wood_ready: number;
  stone_per_hr: number;
  stone_pp: number;
  stone_worksites: number;
  stone_ready: number;
  iron_per_hr: number;
  iron_pp: number;
  iron_worksites: number;
  iron_ready: number;
  sps_per_hr: number;
  sps_pp: number;
  sps_worksites: number;
  sps_ready: number;
  grain_per_hr: number;
  grain_pp: number;
  grain_worksites: number;
  grain_ready: number;
  research_per_hr: number;
  research_pp: number;
  research_worksites: number;
  research_ready: number;
  aura_per_hr: number;
  aura_pp: number;
  aura_worksites: number;
  aura_ready: number;
  dark_energy_staked: number;
  plots_ready_to_harvest: number;
  last_claimed: string;
  grain_required: number;
  grain_req_per_hour: number;
}

export interface SplProductionOverviewResponse {
  status: string;
  data: {
    plot_overview: {
      player: string;
      production: SplProductionOverviewPlot[];
    };
    productivity_overview: {
      work_sites: unknown[];
    };
    dark_energy: {
      total_dec_staked: number;
    };
    regions: {
      items: SplProductionOverviewRegion[];
    };
  };
}

// === Harvestable Resources API ===

export interface SplHarvestableResource {
  amount_claimable: number;
  grain_required_for_food: number;
  wood_required: number;
  stone_required: number;
  iron_required: number;
  token_symbol: string;
}

export interface SplHarvestableResponse {
  status: string;
  data: SplHarvestableResource[];
}

// === Region Overview API (/land/resources/production/region/overview) ===

export interface SplRegionOverviewResourceRecipe {
  qty: number;
  symbol: string;
}

export interface SplRegionOverviewGrain {
  regional_grain: number;
  workers: number;
  percent_for_claim: number;
  surplus_or_deficit: number;
}

export interface SplRegionOverviewResearch {
  current: number;
  lifetime: number;
}

export interface SplRegionOverviewDarkEnergy {
  total_dark_energy: number;
  total_dark_energy_in_use: number;
  dark_energy_required: number;
}

export interface SplRegionOverviewPlot {
  region_number: number;
  tract_number: number;
  plot_number: number;
  deed_type: string;
  is_powered: boolean;
  plot_status: string;
  rarity: string;
  worksite: string;
  total_boost: number;
  total_dec_stake_needed: number;
  dec_stake_needed_discount: number;
  total_base_pp_after_cap: number;
  resource_symbol: string;
  site_efficiency: number;
  should_apply_recipe: boolean;
  dec_staked: number;
  grain_req_per_hour: number;
  grain_required: number;
  grain_food_discount: number;
  plot_id: number;
  territory: string;
  site_capacity: number;
}

export interface SplRegionOverviewData {
  name: string;
  uid: string;
  region_number: number;
  resource_recipes: Record<string, SplRegionOverviewResourceRecipe[]>;
  darkEnergy: SplRegionOverviewDarkEnergy;
  grain: SplRegionOverviewGrain;
  research: SplRegionOverviewResearch;
  wood: number;
  stone: number;
  iron: number;
  aura: number;
  plots: SplRegionOverviewPlot[];
}

export interface SplRegionOverviewResponse {
  status: string;
  data: SplRegionOverviewData;
}

// === Player Resource Balance API ===

export interface SplPlayerResourceBalance {
  token_symbol: string;
  balance: number;
}
