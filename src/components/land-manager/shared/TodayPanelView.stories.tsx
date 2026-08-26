import { TodayLogs } from "@/types/landManager";
import {
  HarvestAllDeedResult,
  LaborsLuckTreasure,
  SplTrxResult,
} from "@/types/spl/trx";
import { SplCardDetails } from "@/types/splCardDetails";
import { Meta, StoryObj } from "@storybook/react";
import TodayPanelView from "./TodayPanelView";

const meta: Meta<typeof TodayPanelView> = {
  title: "Land Manager/Components/LandManager/Shared/TodayPanelView",
  component: TodayPanelView,
};

export default meta;
type Story = StoryObj<typeof TodayPanelView>;

// ── fixtures ──────────────────────────────────────────────────────────────────

// Only the fields CardUidImage reads matter here; the rest satisfies the type.
const cardDetails: SplCardDetails[] = [
  {
    id: 866,
    name: "Tireless Farmhand",
    color: "Blue",
    type: "Monster",
    sub_type: "",
    rarity: 1,
    is_starter: false,
    editions: "19",
    is_promo: false,
    no_pp: false,
    tier: 19,
  },
  {
    id: 500,
    name: "Fernheart",
    color: "Green",
    type: "Summoner",
    sub_type: "",
    rarity: 3,
    is_starter: false,
    editions: "8",
    is_promo: false,
    no_pp: false,
  },
];

const goldTreasure: LaborsLuckTreasure = {
  uid: "G19-866-2632A608C0",
  card_detail_id: 866,
  xp: 1,
  gold: true,
  tier: 19,
  foil: 1,
  mint: null,
};

// Foil id above 1 (gold arcane) — a single copy is already max level.
const arcaneTreasure: LaborsLuckTreasure = {
  uid: "B19-866-9F1C77B2D1",
  card_detail_id: 866,
  xp: 1,
  gold: true,
  tier: 19,
  foil: 3,
  mint: 42,
};

function harvestDeedResult(
  overrides: Partial<HarvestAllDeedResult> = {}
): HarvestAllDeedResult {
  return {
    id: 109512,
    project_number: 2,
    deed_uid: "I-299-2ba36c7a1079f9",
    plot_id: 5800,
    tract_number: 1,
    region_number: 58,
    land_work_type_id: 10,
    resource_amount: 1217664,
    received_amount: 1095897.6,
    tax_amount: 121766.4,
    resource_symbol: "GRAIN",
    result_message: "Successful",
    grain_eaten: 115920,
    grain_rewards_eaten: 0,
    work_efficiency: 1,
    dec_spent: 0,
    is_worksite_transition: false,
    new_worksite_type: "",
    inputs_consumed: [],
    fragment_chance: 0,
    fragment_roll: 0,
    elapsed_hours: 168,
    ...overrides,
  };
}

const harvestTx: SplTrxResult = {
  op: "harvest_all",
  result: {
    success: true,
    message: "3 deeds were harvested",
    results: [
      harvestDeedResult({ labors_luck_treasure: goldTreasure }),
      harvestDeedResult({
        id: 109513,
        deed_uid: "I-299-aa11bb22cc33dd",
        resource_symbol: "WOOD",
        labors_luck_treasure: arcaneTreasure,
      }),
      harvestDeedResult({ id: 109514, deed_uid: "I-299-ff99ee88dd77cc" }),
    ],
    deeds: [],
    num_worksite_transitions: 0,
  },
};

const mythicTx: SplTrxResult = {
  op: "tax_collection",
  result: {
    deed_uid: "I-295-0265cadb241e9c",
    kingdom_type: "keep",
    elapsed_hours: 167.413,
    tokens: [
      { token: "SPS", received: "182.983" },
      { token: "GRAIN", received: "32979.353" },
    ],
    fragment_found: true,
    fragment_chance: 0.17578365,
    fragment_roll: 0.03949384247648733,
    fragment_type: "TOTEMFC",
  },
};
const mythicTx2: SplTrxResult = {
  op: "tax_collection",
  result: {
    deed_uid: "I-295-99aa88bb77cc66",
    kingdom_type: "castle",
    elapsed_hours: 167.413,
    tokens: [
      { token: "SPS", received: "182.983" },
      { token: "GRAIN", received: "32979.353" },
    ],
    fragment_found: true,
    fragment_chance: 0.17578365,
    fragment_roll: 0.03949384247648733,
    fragment_type: "TOTEMFE",
  },
};

const fullData: TodayLogs = {
  harvest: {
    runs: 2,
    resources_json: { GRAIN: 1217664, WOOD: 65152.9, STONE: 10903.96 },
    donations_json: { GRAIN: 2000.28, WOOD: 1234.123 },
    unpaid_donations_json: {},
    donation_error: null,
    harvest_transactions: ["tx-harvest-1", "tx-harvest-2"],
    donation_transactions: ["tx-donation-1"],
  },
  makeHarvestable: {
    runs: 1,
    actions_json: [
      {
        type: "transfer",
        from_region: "Region 29",
        to_region: "Region 58",
        from_symbol: "GRAIN",
        to_symbol: "GRAIN",
        in_amount: 50000,
        out_amount: 45000,
      },
      {
        type: "pool",
        from_region: "Region 58",
        to_region: "Region 58",
        from_symbol: "DEC",
        to_symbol: "WOOD",
        in_amount: 0.25,
        out_amount: 12000,
      },
      {
        type: "swap",
        from_region: "Region 58",
        to_region: "Region 60",
        from_symbol: "GRAIN",
        to_symbol: "WOOD",
        in_amount: 1000,
        out_amount: 12000,
      },
      {
        type: "buy_dec",
        from_region: "Region 60",
        to_region: "Region 60",
        from_symbol: "DEC",
        to_symbol: "WOOD",
        in_amount: 1000,
        out_amount: 12000,
      },
    ],
    transactions: ["tx-mh-1"],
  },
  postHarvest: {
    runs: 1,
    actions_json: [
      {
        type: "sell_for_dec",
        region_uid: "R-58",
        symbol: "STONE",
        resource_amount: 4000,
        dec_amount: 812.5,
      },
      {
        type: "add_to_pool",
        region_uid: "R-58",
        symbol: "GRAIN",
        resource_amount: 100000,
        dec_amount: 950.125,
      },
      {
        type: "swap_resource",
        region_uid: "R-58",
        symbol: "GRAIN",
        to_symbol: "WOOD",
        resource_amount: 10000,
        dec_amount: 480.5,
        to_resource_amount: 2000,
      },
      // Same donor, different destination — must NOT merge with the row above.
      {
        type: "swap_resource",
        region_uid: "R-58",
        symbol: "GRAIN",
        to_symbol: "IRON",
        resource_amount: 8000,
        dec_amount: 390.25,
        to_resource_amount: 150,
      },
      {
        type: "buy_resource",
        region_uid: "R-58",
        symbol: "GRAIN",
        dec_amount: 300,
        // `resource_amount` is what you RECEIVE here — direction follows `type`.
        resource_amount: 2000,
      },
    ],
    transactions: ["tx-ph-1"],
  },
  mythicHarvest: {
    runs: 1,
    results_json: [
      {
        deed_uid: "I-295-0265cadb241e9c",
        region_uid: "R-29",
        region_number: 29,
        tract_number: 1,
        kingdom_type: "keep",
        tokens: [
          { token: "SPS", received: 182.983 },
          { token: "GRAIN", received: 32979.353 },
        ],
        fragment_found: false,
        fragment_chance: 0.17578365,
      },
      {
        deed_uid: "I-295-99aa88bb77cc66",
        region_uid: "R-29",
        region_number: 29,
        kingdom_type: "castle",
        tokens: [
          { token: "SPS", received: 45.101 },
          { token: "WOOD", received: 20032.4 },
        ],
        fragment_found: true,
        fragment_chance: 0.05,
      },
    ],
    donations_json: { SPS: 3.66 },
    unpaid_donations_json: {},
    donation_error: null,
    transactions: ["tx-mythic-1", "tx-mythic-2"],
    donation_transactions: ["tx-mythic-donation-1"],
  },
  worker: {
    runs: 1,
    rented_count: 12,
    bought_count: 3,
    staked_count: 15,
    rent_total_dec: 421.5,
    buy_total_dec: 1890.25,
    buy_total_usd: 7.42,
    rent_transactions: ["tx-rent-1"],
    purchase_transactions: ["tx-buy-1"],
    stake_transactions: ["tx-stake-1"],
  },
  stakeDec: {
    runs: 1,
    succeeded_json: { "R-58": 25000, "R-230": 250 },
    failed_json: { "R-1": 250, "R-2": 5 },
    total_succeeded: 25250,
    total_failed: 255,
    error: null,
    transactions: ["tx-stakedec-1"],
  },
  unstakeDec: {
    runs: 1,
    succeeded_json: { "R-58": 25000, "R-230": 2500 },
    failed_json: {},
    total_succeeded: 25000,
    total_failed: 100,
    error: null,
    transactions: ["tx-stakedec-1"],
  },
};

const verifiedTxIds = new Set([
  "tx-harvest-1",
  "tx-harvest-2",
  "tx-donation-1",
  "tx-mh-1",
  "tx-ph-1",
  "tx-mythic-1",
  "tx-mythic-2",
  "tx-mythic-donation-1",
  "tx-rent-1",
  "tx-buy-1",
  "tx-stake-1",
  "tx-stakedec-1",
]);

const txResults = new Map<string, SplTrxResult>([
  ["tx-harvest-1", harvestTx],
  ["tx-mythic-1", mythicTx],
  ["tx-mythic-2", mythicTx2],
]);

// ── stories ───────────────────────────────────────────────────────────────────

export const Loading: Story = {
  args: {
    data: null,
    loading: true,
  },
};

export const NoActivity: Story = {
  args: {
    data: {
      harvest: null,
      makeHarvestable: null,
      postHarvest: null,
      mythicHarvest: null,
      worker: null,
      stakeDec: null,
      unstakeDec: null,
    },
  },
};

/** Every section populated, all transactions confirmed. */
export const FullDay: Story = {
  args: { data: fullData, verifiedTxIds, txResults, cardDetails },
};

/**
 * Transactions still pending — the fragment and Labor's Luck rewards are only
 * known once the lookup returns, so neither is shown yet.
 */
export const AwaitingConfirmation: Story = {
  args: { data: fullData, cardDetails },
};

/** A gold and a gold-arcane Labor's Luck card awarded during the harvest. */
export const LaborsLuckRewards: Story = {
  args: {
    data: { ...fullData, mythicHarvest: null, worker: null, stakeDec: null },
    verifiedTxIds,
    txResults,
    cardDetails,
  },
};

/** A Common Totem Fragment dropped on one of the mythic deeds. */
export const TotemFragmentFound: Story = {
  args: {
    data: {
      ...fullData,
      harvest: null,
      makeHarvestable: null,
      postHarvest: null,
      worker: null,
      stakeDec: null,
    },
    verifiedTxIds,
    txResults,
    cardDetails,
  },
};

/** One harvest transaction rejected on-chain, plus unpaid donations. */
export const WithFailures: Story = {
  args: {
    data: {
      ...fullData,
      harvest: {
        ...fullData.harvest!,
        unpaid_donations_json: { GRAIN: 24353.28 },
        donation_error: "Cancelled in Hive Keychain",
      },
      stakeDec: {
        ...fullData.stakeDec!,
        failed_json: { "R-29": 8000 },
        total_failed: 8000,
        error: "Insufficient DEC balance",
      },
    },
    verifiedTxIds: new Set(["tx-harvest-2"]),
    failedTxIds: new Map([["tx-harvest-1", "Deed is not harvestable yet"]]),
    cardDetails,
  },
};
