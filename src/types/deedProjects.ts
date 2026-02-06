/**
 * Type definitions for Splinterlands Land Deed Project API responses
 */

export interface SplDeedProjectSegment {
  id: number;
  land_project_id: number;
  deed_uid: string;
  staked_pp: number;
  project_number: number;
  created_date: string;
  ended_date: string | null;
  closed_trx: string | null;
  opened_trx: string;
  duration: number;
  raw_pp_spent: number;
  pp_spent: number;
  timecrystal_pp: number;
  efficiency: number;
  time_crystal_value: number;
  time_crystals_used: number;
  source: string;
  end_staked_pp: number;
}

export interface SplResourceRecipe {
  qty: number;
  symbol: string;
}

export interface SplDeedProject {
  id: number;
  project_type: string;
  project_number: number;
  deed_uid: string;
  land_work_type_id: number;
  total_time_crystals_used: number;
  pp_balance: number;
  start_date: string;
  projected_hours: number;
  projected_end: string | null;
  completed_date: string | null;
  created_date: string;
  last_updated_date: string;
  trx_id: string;
  block_num: number;
  resource_id: number;
  token_symbol: string;
  pp_required: number;
  hours_to_completion: number | null;
  elapsed_hours: number;
  pp_spent: number;
  grain_required: number;
  wood_required: number;
  stone_required: number;
  iron_required: number;
  is_active: boolean;
  destroyed_date: string | null;
  is_construction: boolean;
  last_action_time: string;
  hours_till_next_op: number;
  next_op_allowed_date: string | null;
  pp_staked: number;
  projected_amount_received: number;
  work_per_hour_per_one_pp: number;
  project_id: number | null;
  is_harvesting: boolean;
  is_empty: boolean;
  is_sps_work: boolean | null;
  sps_mining_reward_debt: number;
  latest_sps_reward_block: number;
  sps_tokens_per_block: number;
  accumulated_sps_rewards_per_share_of_pool: number;
  land_work_type_total_work_type_pp: number;
  captured_tax_rate: number;
  time_crystal_value: number;
  project_created_date: string;
  worksite_type: string;
  max_tax_rate: number;
  region_uid: string;
  hours_since_last_op: number;
  site_efficiency: number;
  is_runi_staked: boolean;
  rewards_per_hour: number;
  grain_req_per_hour: number;
  segments: SplDeedProjectSegment[];
  estimated_totem_chance: number;
  resource_recipe: SplResourceRecipe[];
  resource_mint_rate: number;
}

export interface SplDeedProjectsResponse {
  status: string;
  data: SplDeedProject[];
}
