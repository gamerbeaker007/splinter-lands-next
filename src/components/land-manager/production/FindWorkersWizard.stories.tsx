import type { UseAuthorityStatus } from "@/hooks/useAuthorityStatusCore";
import type {
  UseWorkerAction,
  WorkerExecuteResult,
} from "@/hooks/useWorkerAction";
import type {
  BuyExecutionPlan,
  RentalExecutionPlan,
} from "@/lib/shared/workerPlan";
import {
  DEFAULT_BUY_CONFIG,
  DEFAULT_RENTAL_CONFIG,
  RentalEligiblePlot,
  WorkerPlanItem,
  WorkerPlanPick,
  WorkerPlanPlotCard,
} from "@/types/landManager";
import type { DeedComplete } from "@/types/deed";
import type { Prices } from "@/types/price";
import type { Meta, StoryObj } from "@storybook/react";
import type { Dispatch, SetStateAction } from "react";
import { userEvent, within } from "storybook/test";
import { useState } from "react";
import FindWorkersWizard from "./FindWorkersWizard";

type Scenario = "results" | "loading" | "error" | "empty" | "many";

const plot: RentalEligiblePlot = {
  deed_uid: "plot-story-65-12-8",
  map_name: "praetoria",
  region_id: 65,
  tract_id: 12,
  plot_id: 651208,
  plot_number: 8,
  tract_number: 12,
  region_uid: "praetoria-65",
  region_number: 65,
  territory: "centerra",
  resource_id: null,
  resource_symbol: "GRAIN",
  magic_type: null,
  stats: null,
  player: "story-user",
  created_date: null,
  listed: false,
  lock_days: null,
  unlock_date: null,
  in_use: null,
  deed_type: "plains",
  land_stats: { resources: ["GRAIN"] },
  region_name: "Centerra",
  market_updated_date: null,
  market_id: null,
  listing_price: null,
  market_listing_id: null,
  market_listing_status_id: null,
  castle: null,
  keep: null,
  rarity: "rare",
  plot_status: "kingdom",
  hex_code: null,
  tax_rate: null,
  item_detail_id: null,
  created_block_num: null,
  created_tx: null,
  worksite_type: "Grain Farm",
  time_crystal_value: null,
  rarity_sort_value: null,
  is_construction: false,
  worksiteDetail: {
    deed_uid: "plot-story-65-12-8",
    token_symbol: "GRAIN",
    id: 1,
    worksite_type: "Grain Farm",
  },
  stakingDetail: {
    deed_uid: "plot-story-65-12-8",
    region_uid: "praetoria-65",
    is_powered: true,
    is_runi_staked: false,
    runi_boost: null,
    total_runi_boost_pp: null,
    title_boost: null,
    totem_boost: null,
  },
  worker_count: 2,
  max_workers: 5,
  empty_slots: 3,
  is_powered: true,
  biome_modifiers: {
    fire: 0.25,
    water: 0,
    life: 0,
    death: 0,
    earth: 0,
    dragon: 0,
  },
};

const picks: WorkerPlanPick[] = [0, 1].map((index) => ({
  market_id: `market-${index + 1}`,
  card_uid: `worker-${index + 1}`,
  card_detail_id: 395,
  card_name: index === 0 ? "Radiated Scorcher" : "Radiated Brute",
  edition: 7,
  rarity: index === 0 ? "rare" : "epic",
  bcx: 4 + index,
  max_bcx: 115,
  foil: 0,
  gold: false,
  level: 4,
  color: "red",
  card_set: "chaos",
  element: "fire",
  secondary_element: null,
  bloodline: "Unknown",
  biome_modifier: 0.25,
  land_base_pp: 1420 + index * 120,
  effective_pp: 1775 + index * 150,
  total_dec: index === 0 ? 84 : 96,
  total_usd: index === 0 ? 1.68 : 1.92,
  pp_per_dec: (1420 + index * 120) / (index === 0 ? 84 : 96),
  seller: `land-worker-${index + 1}`,
  card_image_url:
    "https://d36mxiodymuqjm.cloudfront.net/cards_by_level/chaos/Radiated%20Scorcher_lv1.png",
  buy_price_per_day: index === 0 ? 6 : 7,
  rental_days: 14,
  expiration_date: "2026-10-30T00:00:00.000Z",
}));

const item: WorkerPlanItem = {
  plot,
  picks,
  slots_filled: picks.length,
  slots_skipped: 1,
  plot_total_dec: picks.reduce((total, pick) => total + pick.total_dec, 0),
  skip_reason: null,
};

const manyItems: WorkerPlanItem[] = Array.from({ length: 24 }, (_, index) => {
  const deedUid = `plot-story-${index + 1}`;
  const nextPlot: RentalEligiblePlot = {
    ...plot,
    deed_uid: deedUid,
    plot_id: 651208 + index,
    plot_number: index + 1,
    tract_number: 12 + Math.floor(index / 6),
    region_uid: `praetoria-${65 + Math.floor(index / 12)}`,
    region_number: 65 + Math.floor(index / 12),
    region_name: index < 12 ? "Centerra" : "Northreach",
    territory: index % 2 === 0 ? "centerra" : "northreach",
    rarity: ["common", "rare", "epic", "legendary"][index % 4],
    resource_symbol: ["GRAIN", "WOOD", "STONE", "IRON"][index % 4],
    worksite_type: ["Grain Farm", "Logging Camp", "Quarry", "Iron Mine"][
      index % 4
    ],
    worksiteDetail: {
      ...plot.worksiteDetail,
      deed_uid: deedUid,
      token_symbol: ["GRAIN", "WOOD", "STONE", "IRON"][index % 4],
      worksite_type: ["Grain Farm", "Logging Camp", "Quarry", "Iron Mine"][
        index % 4
      ],
    },
    stakingDetail: {
      ...plot.stakingDetail,
      deed_uid: deedUid,
      region_uid: `praetoria-${65 + Math.floor(index / 12)}`,
    },
  };
  const nextPicks = picks.map((pick, pickIndex) => ({
    ...pick,
    market_id: `market-${index + 1}-${pickIndex + 1}`,
    card_uid: `worker-${index + 1}-${pickIndex + 1}`,
  }));
  return {
    ...item,
    plot: nextPlot,
    picks: nextPicks,
    plot_total_dec: nextPicks.reduce(
      (total, pick) => total + pick.total_dec,
      0
    ),
  };
});

const currentWorkers: WorkerPlanPlotCard[] = [
  {
    uid: "current-worker-1",
    name: "Furious Chicken",
    rarity: "common",
    set: "chaos",
    element: "fire",
    secondaryElement: null,
    edition: 7,
    foil: 0,
    bcx: 1,
    maxBcx: 115,
    landBasePP: 430,
    landBoostedPP: 538,
    slot: 1,
  },
  {
    uid: "current-worker-2",
    name: "Serpentine Spy",
    rarity: "common",
    set: "chaos",
    element: "fire",
    secondaryElement: null,
    edition: 7,
    foil: 0,
    bcx: 2,
    maxBcx: 115,
    landBasePP: 720,
    landBoostedPP: 900,
    slot: 2,
  },
];

const prices: Prices = {
  GRAIN: 0.02,
  WOOD: 0.05,
  STONE: 0.1,
  IRON: 0.2,
  DEC: 0.0015,
};

function makeRentalExecutionPlan(items: WorkerPlanItem[]): RentalExecutionPlan {
  const plotData = makePlotData(items);
  return {
    plan: {
      config: DEFAULT_RENTAL_CONFIG,
      items,
      totals: {
        plots_total: items.length,
        plots_with_picks: items.filter((entry) => entry.picks.length > 0)
          .length,
        slots_total: items.reduce(
          (total, entry) => total + entry.plot.empty_slots,
          0
        ),
        slots_filled: items.reduce(
          (total, entry) => total + entry.slots_filled,
          0
        ),
        total_dec: items.reduce(
          (total, entry) => total + entry.plot_total_dec,
          0
        ),
      },
      warnings: [],
      rental_days: 14,
      rental_days_source: "14 days remaining in the listing terms",
    },
    ...plotData,
  };
}

function makeBuyExecutionPlan(items: WorkerPlanItem[]): BuyExecutionPlan {
  const purchaseItems = items.map((entry) => ({
    ...entry,
    picks: entry.picks.map((pick) => {
      const purchasePick = { ...pick };
      delete purchasePick.buy_price_per_day;
      delete purchasePick.rental_days;
      delete purchasePick.expiration_date;
      return purchasePick;
    }),
  }));
  const plotData = makePlotData(purchaseItems);
  return {
    plan: {
      config: DEFAULT_BUY_CONFIG,
      items: purchaseItems,
      totals: {
        plots_total: purchaseItems.length,
        plots_with_picks: purchaseItems.filter(
          (entry) => entry.picks.length > 0
        ).length,
        slots_total: purchaseItems.reduce(
          (total, entry) => total + entry.plot.empty_slots,
          0
        ),
        slots_filled: purchaseItems.reduce(
          (total, entry) => total + entry.slots_filled,
          0
        ),
        total_dec: purchaseItems.reduce(
          (total, entry) => total + entry.plot_total_dec,
          0
        ),
      },
      warnings: [],
    },
    ...plotData,
  };
}

function makePlotData(items: WorkerPlanItem[]) {
  return {
    emptySlotsByDeed: Object.fromEntries(
      items.map((entry) => [entry.plot.deed_uid, [3, 4, 5]])
    ),
    plotWorkersByDeed: Object.fromEntries(
      items.map((entry) => [
        entry.plot.deed_uid,
        currentWorkers.map((worker, workerIndex) => ({
          ...worker,
          uid: `${entry.plot.deed_uid}-current-${workerIndex + 1}`,
          slot: workerIndex + 1,
        })),
      ])
    ),
  };
}

function makeAuthority(
  authorized: boolean,
  setAuthorized: (value: boolean) => void
): UseAuthorityStatus {
  return {
    status: {
      serviceConfigured: true,
      serviceAccount: "spl-land-manager",
      authorized,
      player: "story-user",
      accounts: authorized ? ["spl-land-manager"] : [],
    },
    loading: false,
    busy: false,
    refresh: async () => {},
    grant: async () => {
      setAuthorized(true);
      return { success: true, confirmed: true };
    },
    revoke: async () => {
      setAuthorized(false);
      return { success: true, confirmed: true };
    },
  };
}

interface ActionState<P> {
  busy: boolean;
  executionPlan: P | null;
  error: string | null;
  result: WorkerExecuteResult | null;
}

interface StoryArgs {
  scenario: Scenario;
  eligibleCount: number | null;
  unpoweredCount: number | null;
  initialAuthorized: boolean;
}

function FindWorkersWizardStory({
  scenario,
  eligibleCount,
  unpoweredCount,
  initialAuthorized,
}: StoryArgs) {
  const [rentAuthorized, setRentAuthorized] = useState(initialAuthorized);
  const [buyAuthorized, setBuyAuthorized] = useState(initialAuthorized);
  const [rentState, setRentState] = useState<ActionState<RentalExecutionPlan>>({
    busy: false,
    executionPlan: null,
    error: null,
    result: null,
  });
  const [buyState, setBuyState] = useState<ActionState<BuyExecutionPlan>>({
    busy: false,
    executionPlan: null,
    error: null,
    result: null,
  });

  const mockPrepare = <P,>(
    setState: Dispatch<SetStateAction<ActionState<P>>>,
    executionPlan: P
  ) => {
    setState((previous) => ({
      ...previous,
      busy: true,
      executionPlan: null,
      error: null,
    }));
    if (scenario === "loading") return;
    if (scenario === "error") {
      setState((previous) => ({
        ...previous,
        busy: false,
        error: "The live market request failed. Try searching again.",
      }));
      return;
    }
    setState((previous) => ({
      ...previous,
      busy: false,
      executionPlan,
    }));
  };

  const rentAction: UseWorkerAction<RentalExecutionPlan> = {
    ...rentState,
    eligiblePlotCount: eligibleCount,
    decBalance: 5000,
    clearExecutionPlan: () =>
      setRentState((previous) => ({ ...previous, executionPlan: null })),
    clearResult: () =>
      setRentState((previous) => ({ ...previous, result: null })),
    clearError: () =>
      setRentState((previous) => ({ ...previous, error: null })),
    prepareExecution: async () =>
      mockPrepare(
        setRentState,
        makeRentalExecutionPlan(
          scenario === "empty" ? [] : scenario === "many" ? manyItems : [item]
        )
      ),
    execute: async () =>
      setRentState((previous) => ({
        ...previous,
        result: {
          success: true,
          mode: "rent",
          actionTxIds: ["rent-tx"],
          stakeTxIds: ["stake-tx"],
          count: 2,
          stakedCount: 2,
          totalDec: 180,
          totalUsd: 0,
        },
      })),
  };

  const buyAction: UseWorkerAction<BuyExecutionPlan> = {
    ...buyState,
    eligiblePlotCount: eligibleCount,
    decBalance: 5000,
    clearExecutionPlan: () =>
      setBuyState((previous) => ({ ...previous, executionPlan: null })),
    clearResult: () =>
      setBuyState((previous) => ({ ...previous, result: null })),
    clearError: () => setBuyState((previous) => ({ ...previous, error: null })),
    prepareExecution: async () =>
      mockPrepare(
        setBuyState,
        makeBuyExecutionPlan(
          scenario === "empty" ? [] : scenario === "many" ? manyItems : [item]
        )
      ),
    execute: async () =>
      setBuyState((previous) => ({
        ...previous,
        result: {
          success: true,
          mode: "buy",
          actionTxIds: ["buy-tx"],
          stakeTxIds: ["stake-tx"],
          count: 2,
          stakedCount: 2,
          totalDec: 180,
          totalUsd: 3.6,
        },
      })),
  };

  const deedByUid = new Map<string, DeedComplete>(
    [plot, ...manyItems.map((entry) => entry.plot)].map((deed) => [
      deed.deed_uid,
      deed,
    ])
  );

  return (
    <FindWorkersWizard
      open
      onClose={() => {}}
      eligibleCount={eligibleCount}
      unpoweredCount={unpoweredCount}
      rentalConfig={DEFAULT_RENTAL_CONFIG}
      buyConfig={DEFAULT_BUY_CONFIG}
      onOpenConfig={() => {}}
      rentAction={rentAction}
      buyAction={buyAction}
      rentalAuthority={makeAuthority(rentAuthorized, setRentAuthorized)}
      purchaseAuthority={makeAuthority(buyAuthorized, setBuyAuthorized)}
      deedByUid={deedByUid}
      prices={prices}
      spsRatio={0.035}
      regionTax={[]}
    />
  );
}

const meta: Meta<typeof FindWorkersWizardStory> = {
  title: "Land Manager/Production/Find Workers Wizard",
  component: FindWorkersWizardStory,
  parameters: { layout: "fullscreen" },
  argTypes: {
    scenario: {
      control: "radio",
      options: ["results", "loading", "error", "empty", "many"],
    },
    eligibleCount: { control: "number" },
    unpoweredCount: { control: "number" },
    initialAuthorized: { control: "boolean" },
  },
  args: {
    scenario: "results",
    eligibleCount: 4,
    unpoweredCount: 2,
    initialAuthorized: true,
  },
};

export default meta;
type Story = StoryObj<typeof FindWorkersWizardStory>;

async function openRentResults() {
  await userEvent.click(
    within(document.body).getByRole("button", { name: "Find Workers to Rent" })
  );
}

async function openBuyResults() {
  await userEvent.click(
    within(document.body).getByRole("button", { name: "Find Workers to Buy" })
  );
}

export const InitialWizard: Story = {};

export const AuthorizationMissing: Story = {
  args: { initialAuthorized: false },
};

export const NoEligiblePlots: Story = {
  args: { eligibleCount: 0, unpoweredCount: 3 },
};

export const RentSearchLoading: Story = {
  args: { scenario: "loading" },
  play: openRentResults,
};

export const SearchError: Story = {
  args: { scenario: "error" },
  play: openRentResults,
};

export const NoResults: Story = {
  args: { scenario: "empty" },
  play: openRentResults,
};

export const RentResults: Story = {
  play: openRentResults,
};

export const BuyResults: Story = {
  play: openBuyResults,
};

export const EditLocalSettingsAndSearchAgain: Story = {
  play: async () => {
    await openRentResults();
    await userEvent.click(
      within(document.body).getByRole("button", {
        name: /Plots per run:/,
      })
    );
    await within(document.body).getByRole("slider").press("End");
    await userEvent.click(
      within(document.body).getByRole("button", { name: "Done" })
    );
    await userEvent.click(
      within(document.body).getByRole("button", { name: "Search Again" })
    );
  },
};

export const PlotsExcludedWhenUnpowered: Story = {
  args: { eligibleCount: 2, unpoweredCount: 5 },
};

export const ManyPlotsPaginated: Story = {
  args: { scenario: "many", eligibleCount: 24 },
  play: async () => {
    await openRentResults();
    await userEvent.click(
      within(document.body).getByRole("button", { name: "Go to page 2" })
    );
  },
};
