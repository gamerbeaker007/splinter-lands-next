/**
 * Type definitions for Splinterlands Land Deed Harvest/Reward Actions API responses
 */

export interface SplFragmentRoll {
  reward_action_id: number | null;
  land_work_type_id: number | null;
  land_project_number: number | null;
  deed_uid: string;
  fragment_type: string | null;
  fragment_found: boolean | null;
  fragment_chance: number | null;
  fragment_roll: number | null;
  labors_luck_uid: string | null;
  labors_luck_chance: number | null;
  labors_luck_roll: number | null;
  labors_luck_pool_pick: string | null;
  labors_luck_treasures_left: number | null;
}

export interface SplDeedHarvestAction {
  id: number;
  plot_id: number;
  tract_id: number;
  region_uid: string;
  site_efficiency: number;
  region_number: number;
  land_worksite_id: number;
  land_project_id: number;
  resource_id: number;
  resource_symbol: string;
  working_pp: number;
  duration: number;
  deed_uid: string;
  claim_amount: number;
  grain_required: number;
  claim_amount_eaten: number;
  amount_received: number;
  tax_burnt: number;
  amount_taxed: number;
  trx_description: string;
  trx_id: string;
  block_num: number;
  created_date: string;
  last_updated_date: string;
  fragment_roll: SplFragmentRoll;
}

export interface SplDeedHarvestActionsResponse {
  status: string;
  data: SplDeedHarvestAction[];
}
