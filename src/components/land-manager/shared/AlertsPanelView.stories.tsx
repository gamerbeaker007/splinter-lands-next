// Type-only imports: these modules reach server actions (and Prisma), which
// cannot be bundled for the browser that Storybook renders in.
import type { PoolBufferRow } from "@/hooks/usePoolBufferAlerts";
import type { WorksiteAlertsData } from "@/hooks/useWorksiteAlerts";
import type { RegionDECInfo } from "@/lib/backend/actions/land-manager/dec-power-actions";
import type { BiomeModifiers } from "@/lib/utils/cardUtil";
import type { DeedComplete } from "@/types/deed";
import type { WorkerEligiblePlot } from "@/types/landManager";
import { Meta, StoryObj } from "@storybook/react";
import AlertsPanelView, { type AlertsPanelViewProps } from "./AlertsPanelView";

const meta: Meta<typeof AlertsPanelView> = {
  title: "Land Manager/Components/LandManager/Shared/AlertsPanelView",
  component: AlertsPanelView,
};

export default meta;
type Story = StoryObj<typeof AlertsPanelView>;

// ── fixtures ──────────────────────────────────────────────────────────────────
//
// Everything here is static: AlertsPanelView takes pure props, so no server
// action, hook or context is exercised. Only the fields the panel actually
// reads carry meaningful values; the rest exists to satisfy the Prisma types.

const BASE_DEED: DeedComplete = {
  map_name: "Praetoria",
  region_id: 89,
  tract_id: 1442,
  plot_id: 144182,
  region_number: 92,
  tract_number: 10,
  plot_number: 82,
  territory: "Wild Northeast",
  region_uid: "PR-WNE-92",
  resource_id: 1,
  resource_symbol: "AURA",
  magic_type: "",
  stats: '{"building_in_box":true}',
  deed_uid: "I-290-39ea52bf105215",
  player: "beaker007",
  created_date: new Date("2023-04-05T00:27:27.220Z"),
  listed: false,
  lock_days: 3,
  unlock_date: null,
  in_use: true,
  deed_type: "Plains",
  land_stats: '{ "resources": ["grain"] }',
  region_name: "Zilac",
  market_updated_date: null,
  market_id: null,
  listing_price: null,
  market_listing_id: null,
  market_listing_status_id: null,
  castle: null,
  keep: null,
  rarity: "rare",
  plot_status: "occupied",
  hex_code: "#796703",
  tax_rate: "0.10",
  item_detail_id: 290,
  created_block_num: 73725262,
  created_tx: "292139a9007f7c677adf7ccf8ad0035b010aa645",
  worksite_type: "Aura Farm",
  time_crystal_value: 1000,
  rarity_sort_value: 2,
  is_construction: false,
  worksiteDetail: {
    id: 256874,
    project_type: "worksite_grain",
    project_number: 2,
    deed_uid: "I-290-39ea52bf105215",
    land_work_type_id: 10,
    total_time_crystals_used: 0,
    pp_balance: 0,
    start_date: new Date("2025-06-22T06:16:12.000Z"),
    projected_hours: 0,
    projected_end: null,
    completed_date: null,
    created_date: new Date("2025-06-22T06:16:12.000Z"),
    last_updated_date: new Date("2025-06-22T06:16:12.000Z"),
    trx_id: "69a12f5c23f3d1f75b792bee3059b754282c0cdb",
    block_num: 96996856,
    resource_id: 1,
    token_symbol: "AURA",
    pp_required: 0,
    hours_to_completion: null,
    elapsed_hours: 1347.956,
    pp_spent: 0,
    grain_required: 148.425,
    wood_required: 0,
    stone_required: 0,
    iron_required: 0,
    is_active: true,
    destroyed_date: null,
    is_construction: false,
    last_action_time: new Date("2025-08-17T08:14:48.000Z"),
    hours_till_next_op: 0,
    next_op_allowed_date: new Date("2025-08-17T09:14:48.000Z"),
    pp_staked: 9900,
    projected_amount_received: 352.633,
    work_per_hour_per_one_pp: 0.02,
    project_id: 256874,
    is_harvesting: true,
    is_empty: false,
    is_sps_work: false,
    sps_mining_reward_debt: 0,
    latest_sps_reward_block: 0,
    sps_tokens_per_block: 0,
    accumulated_sps_rewards_per_share_of_pool: 0,
    land_work_type_total_work_type_pp: 274895741.907,
    captured_tax_rate: 0,
    time_crystal_value: 1000,
    project_created_date: new Date("2025-06-22T06:16:12.000Z"),
    worksite_type: "Aura Farm",
    max_tax_rate: 0,
    region_uid: "PR-WNE-92",
    hours_since_last_op: 1.979,
    site_efficiency: 1,
    is_runi_staked: false,
    rewards_per_hour: 198,
    grain_req_per_hour: 75,
    segments: null,
    estimated_totem_chance: 0.0001,
    resource_recipe: [],
    resource_mint_rate: 0.02,
  },
  stakingDetail: {
    region_uid: "PR-WNE-92",
    deed_uid: "I-290-39ea52bf105215",
    is_powered: true,
    is_runi_staked: false,
    is_power_core_staked: true,
    max_workers_allowed: 5,
    runi_boost: 1,
    title_boost: 0,
    totem_boost: 0.1,
    deed_status_token_boost: 0,
    deed_rarity_boost: 0.1,
    is_energized: true,
    has_labors_luck: true,
    card_abilities_boost: 0.1,
    card_bloodlines_boost: 0.2,
    grain_food_discount: -0.2,
    lite_food_discount: -0.1,
    dec_stake_needed_discount: -0.4,
    total_boost: 0.2,
    total_base_pp_cap: 100000,
    total_base_pp: 7500,
    total_base_pp_after_cap: 7500,
    total_base_pp_after_cap_percentage: 1,
    total_construction_pp: 8250,
    total_terrain_boost: 0.1,
    total_terrain_boost_pp: 750,
    total_dec_stake_needed: 50000,
    total_dec_stake_in_use: 50000,
    efficiency: 1,
    total_deed_rarity_boost: 0.1,
    total_deed_rarity_boost_pp: 825,
    total_deed_status_token_boost: 0,
    total_deed_status_token_boost_pp: 0,
    total_card_abilities_boost_pp: 100000,
    total_card_bloodlines_boost_pp: 999999,
    total_runi_boost: 1,
    total_runi_boost_pp: 5000,
    total_title_boost: 0,
    total_title_boost_pp: 0,
    total_totem_boost: 0.1,
    total_totem_boost_pp: 825,
    total_boost_pp: 1650,
    total_harvest_pp: 9999999999,
    total_work_per_hour: 198,
    powered_worker_count: 5,
    worker_count: 5,
    manager: "beaker007",
    active_land_project_id: 256874,
    has_completed_first_project: true,
    red_biome_modifier: 0,
    blue_biome_modifier: -0.5,
    white_biome_modifier: 0.1,
    black_biome_modifier: 0,
    green_biome_modifier: -0.5,
    gold_biome_modifier: 0.1,
    total_dec_staked: 250000,
  },
};

function makeDeed(overrides: Partial<DeedComplete> = {}): DeedComplete {
  return { ...BASE_DEED, ...overrides };
}

const NO_BIOME_MODIFIERS: BiomeModifiers = {
  red: 0,
  blue: 0,
  white: 0,
  black: 0,
  green: 0,
  gold: 0,
};

function makeEligiblePlot(
  plotNumber: number,
  emptySlots: number,
  isPowered = true
): WorkerEligiblePlot {
  return {
    ...makeDeed({
      deed_uid: `I-290-eligible-${plotNumber}`,
      plot_number: plotNumber,
    }),
    worker_count: 5 - emptySlots,
    max_workers: 5,
    empty_slots: emptySlots,
    is_powered: isPowered,
    biome_modifiers: NO_BIOME_MODIFIERS,
  };
}

/** One plot whose construction has finished and is waiting to be fed. */
function feedCandidate(
  plotNumber: number,
  regionUid: string,
  grainCost: number
) {
  return {
    deed: makeDeed({
      deed_uid: `I-290-feed-${plotNumber}`,
      plot_number: plotNumber,
      region_uid: regionUid,
    }),
    plotLabel: `P-92-10-${plotNumber}`,
    regionUid,
    regionName: "Zilac",
    grainCost,
    projectId: 300000 + plotNumber,
  };
}

const NO_WORKSITE_ALERTS: WorksiteAlertsData = {
  loading: false,
  feedPlan: {
    feedable: [],
    shortOnGrain: [],
    grainSpentByRegion: {},
    grainNeededByRegion: {},
  },
  fixTargets: [],
  undeveloped: [],
  hasPending: false,
};

/** Two worksites ready to feed, two starved of grain, three plots undeveloped. */
const WORKSITE_ALERTS: WorksiteAlertsData = {
  loading: false,
  feedPlan: {
    feedable: [
      feedCandidate(11, "PR-WNE-92", 148),
      feedCandidate(12, "PR-WNE-92", 220),
    ],
    shortOnGrain: [
      feedCandidate(21, "PR-SWE-58", 410),
      feedCandidate(22, "PR-SWE-58", 395),
    ],
    grainSpentByRegion: { "PR-WNE-92": 368 },
    grainNeededByRegion: { "PR-SWE-58": 805 },
  },
  fixTargets: [{ regionUid: "PR-SWE-58", grainNeeded: 805 }],
  undeveloped: [
    { deedUid: "I-290-undev-1", plotLabel: "P-92-10-31" },
    { deedUid: "I-290-undev-2", plotLabel: "P-92-10-32" },
    { deedUid: "I-290-undev-3", plotLabel: "P-58-4-7" },
  ],
  hasPending: true,
};

const HEALTHY_POOLS: PoolBufferRow[] = [
  {
    symbol: "GRAIN",
    weeklyExternalNeed: 12000,
    poolResource: 180000,
    unlockedResource: 150000,
    weeksCovered: 15,
    belowBuffer: false,
  },
];

const LOW_POOLS: PoolBufferRow[] = [
  {
    symbol: "WOOD",
    weeklyExternalNeed: 8400,
    poolResource: 9800,
    unlockedResource: 4200,
    weeksCovered: 1.2,
    belowBuffer: true,
  },
  {
    symbol: "STONE",
    weeklyExternalNeed: 3100,
    poolResource: 5200,
    unlockedResource: 2600,
    weeksCovered: 1.7,
    belowBuffer: true,
  },
  ...HEALTHY_POOLS,
];

function decRegion(
  regionNumber: number,
  needed: number,
  inUse: number
): RegionDECInfo {
  return {
    region_number: regionNumber,
    region_uid: `PR-WNE-${regionNumber}`,
    total_plot_count: 25,
    dec_stake_needed: needed,
    dec_stake_in_use: inUse,
  };
}

/** Every region exactly funded — the panel's "DEC stake sufficient" state. */
const DEC_BALANCED: RegionDECInfo[] = [
  decRegion(92, 250000, 250000),
  decRegion(58, 180000, 180000),
];

const ELIGIBILITY = {
  eligible: [makeEligiblePlot(41, 3), makeEligiblePlot(42, 2)],
  unpoweredSkipped: [makeEligiblePlot(43, 5, false)],
};

const BASE_PROPS: AlertsPanelViewProps = {
  loading: false,
  poolBufferRows: HEALTHY_POOLS,
  eligibility: { eligible: [], unpoweredSkipped: [] },
  stakedDEC: DEC_BALANCED,
  totalStaked: 430000,
  totalRequired: 430000,
  globalShortfall: 0,
  globalExcess: 0,
  worksiteAlerts: NO_WORKSITE_ALERTS,
  onFeedWorkers: () => {},
  onFixGrainDeficit: () => {},
};

// ── stories ───────────────────────────────────────────────────────────────────

/** Nothing needs attention — the panel renders nothing at all. */
export const NothingToReport: Story = {
  args: { ...BASE_PROPS },
};

/** DEC/eligibility data still loading: the panel shows its skeleton. */
export const Loading: Story = {
  args: {
    ...BASE_PROPS,
    loading: true,
  },
};

/**
 * The worksite rows added for the Worksite alerts feature: finished
 * construction waiting to be fed, ready plots starved of grain, and plots with
 * no building at all.
 */
export const WorksiteActionsPending: Story = {
  args: {
    ...BASE_PROPS,
    worksiteAlerts: WORKSITE_ALERTS,
  },
};

/** Not enough DEC staked globally, with the per-region gaps listed. */
export const DecShortfall: Story = {
  args: {
    ...BASE_PROPS,
    stakedDEC: [decRegion(92, 250000, 190000), decRegion(58, 180000, 180000)],
    totalStaked: 370000,
    totalRequired: 430000,
    globalShortfall: 60000,
  },
};

/** More DEC staked than required — the unstake suggestion. */
export const DecOverStaked: Story = {
  args: {
    ...BASE_PROPS,
    stakedDEC: [decRegion(92, 250000, 300000), decRegion(58, 180000, 180000)],
    totalStaked: 480000,
    totalRequired: 430000,
    globalExcess: 50000,
  },
};

/**
 * Global DEC is balanced but individual regions are not, so DEC has to move
 * between them rather than be staked or unstaked.
 */
export const RegionalImbalance: Story = {
  args: {
    ...BASE_PROPS,
    stakedDEC: [decRegion(92, 250000, 190000), decRegion(58, 180000, 240000)],
    totalStaked: 430000,
    totalRequired: 430000,
  },
};

/** Pool reserves below the recommended buffer, with the per-resource table. */
export const LowPoolBuffers: Story = {
  args: {
    ...BASE_PROPS,
    poolBufferRows: LOW_POOLS,
  },
};

/** Powered plots with empty worker slots, plus unpowered plots. */
export const WorkerSlots: Story = {
  args: {
    ...BASE_PROPS,
    eligibility: ELIGIBILITY,
  },
};

/** Everything at once — the worst-case layout. */
export const AllAlerts: Story = {
  args: {
    ...BASE_PROPS,
    poolBufferRows: LOW_POOLS,
    eligibility: ELIGIBILITY,
    stakedDEC: [decRegion(92, 250000, 190000), decRegion(58, 180000, 180000)],
    totalStaked: 370000,
    totalRequired: 430000,
    globalShortfall: 60000,
    worksiteAlerts: WORKSITE_ALERTS,
  },
};
