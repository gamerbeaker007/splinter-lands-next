import { BuyExecutionPlan } from "@/lib/backend/actions/land-manager/buy-actions";
import { RentalExecutionPlan } from "@/lib/backend/actions/land-manager/rental-actions";
import {
  DEFAULT_BUY_CONFIG,
  DEFAULT_RENTAL_CONFIG,
  RentalEligiblePlot,
  WorkerPlanItem,
  WorkerPlanPick,
} from "@/types/landManager";
import { CardRarity } from "@/types/planner";
import type { Meta, StoryObj } from "@storybook/react";
import WorkerConfirmDialog from "./WorkerConfirmDialog";

// ── Mock helpers ──────────────────────────────────────────────────────────────

const RESOURCES = ["GRAIN", "WOOD", "STONE", "IRON", "GRAIN"];

function makePlot(
  region: number,
  tract: number,
  plot: number,
  emptySlots = 5
): RentalEligiblePlot {
  return {
    deed_uid: `${region}-${tract}-${plot}`,
    map_name: "praetoria",
    region_id: region,
    tract_id: tract,
    plot_id: region * 10000 + tract * 100 + plot,
    plot_number: plot,
    tract_number: tract,
    region_uid: `region-${region}`,
    region_number: region,
    territory: "centerra",
    resource_id: null,
    resource_symbol: RESOURCES[(region + tract + plot) % RESOURCES.length],
    magic_type: null,
    stats: null,
    player: "story-user",
    created_date: null,
    listed: false,
    lock_days: null,
    unlock_date: null,
    in_use: null,
    deed_type: null,
    land_stats: null,
    region_name: `Region ${region}`,
    market_updated_date: null,
    market_id: null,
    listing_price: null,
    market_listing_id: null,
    market_listing_status_id: null,
    castle: null,
    keep: null,
    rarity: null,
    plot_status: null,
    hex_code: null,
    tax_rate: null,
    item_detail_id: null,
    created_block_num: null,
    created_tx: null,
    worksite_type: "Grain Farm",
    time_crystal_value: null,
    rarity_sort_value: null,
    is_construction: false,
    worksiteDetail: null,
    stakingDetail: null,

    worker_count: 0,
    max_workers: 5,
    empty_slots: emptySlots,
    is_powered: true,
    biome_modifiers: {
      fire: (region + tract) % 3 === 0 ? 0.25 : 0,
      water: (region + tract) % 3 === 1 ? 0.25 : 0,
      life: 0,
      death: 0,
      earth: (region + tract) % 3 === 2 ? 0.25 : 0,
      dragon: 0,
    },
  };
}

function makePick(idx: number): WorkerPlanPick {
  const decPerDay = 4 + (idx % 5);
  const days = 14;

  return {
    market_id: `mkt-${idx}`,
    card_uid: `card-${idx}`,
    card_detail_id: 395,
    card_name: "Radiated Scorcher",
    edition: 7,
    rarity: ["common", "rare", "epic", "legendary"][idx % 4] as CardRarity,
    max_bcx: 10,
    bxc: 1 + (idx % 10),
    foil: 1,
    gold: false,
    level: 3 + (idx % 3),
    color: "red",
    biome_modifier: idx % 4 === 0 ? 0.25 : 0,
    land_base_pp: 1100 + idx * 10,
    effective_pp: 1100 + idx * 10 + (idx % 4 === 0 ? 275 : 0),
    buy_price_per_day: decPerDay,
    rental_days: days,
    total_dec: decPerDay * days,
    pp_per_dec: (1100 + idx * 10) / (decPerDay * days),
    seller: `seller${idx % 5}`,
    expiration_date: "2026-06-10T00:00:00.000Z",
    card_image_url:
      "https://d36mxiodymuqjm.cloudfront.net/cards_by_level/chaos/Radiated%20Scorcher_lv1.png",
  };
}

function makeItem(
  region: number,
  tract: number,
  plot: number,
  pickCount: number,
  pickOffset = 0
): WorkerPlanItem {
  const plt = makePlot(region, tract, plot);
  const picks = Array.from({ length: pickCount }, (_, i) =>
    makePick(pickOffset + i)
  );

  return {
    plot: plt,
    picks,
    slots_filled: picks.length,
    slots_skipped: plt.empty_slots - picks.length,
    plot_total_dec: picks.reduce((s, p) => s + p.total_dec, 0),
    skip_reason: null,
  };
}

function makeExecPlan(
  items: WorkerPlanItem[],
  withShortage = false,
  rental = true
): RentalExecutionPlan | BuyExecutionPlan {
  const totals = {
    plots_total: items.length,
    plots_with_picks: items.length,
    slots_total: items.reduce((s, i) => s + i.plot.empty_slots, 0),
    slots_filled: items.reduce((s, i) => s + i.slots_filled, 0),
    total_dec: items.reduce((s, i) => s + i.plot_total_dec, 0),
  };

  const emptySlotsByDeed: Record<string, number[]> = {};

  items.forEach((item, idx) => {
    const shortage = withShortage && idx === 0;
    const available = shortage ? item.picks.length - 1 : item.plot.empty_slots;

    emptySlotsByDeed[item.plot.deed_uid] = Array.from(
      { length: available },
      (_, i) => i + 1
    );
  });

  if (rental) {
    return {
      plan: {
        config: DEFAULT_RENTAL_CONFIG,
        items,
        totals,
        warnings: [],
        rental_days: 14,
        rental_days_source: "season 12 ends 2026-06-10 (14.0d left)",
      },
      emptySlotsByDeed,
    };
  }

  return {
    plan: {
      config: DEFAULT_BUY_CONFIG,
      items,
      totals,
      warnings: [],
    },
    emptySlotsByDeed,
  };
}

// ── Story wrapper ─────────────────────────────────────────────────────────────

type StoryArgs = {
  mode: "rent" | "buy";
  items: WorkerPlanItem[];
  withShortage?: boolean;
  decBalance: number;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function RentBuyConfirmDialogStory(args: StoryArgs) {
  const exec = makeExecPlan(
    args.items,
    args.withShortage,
    args.mode === "rent"
  );

  return args.mode === "rent" ? (
    <WorkerConfirmDialog {...args} exec={exec as RentalExecutionPlan} />
  ) : (
    <WorkerConfirmDialog {...args} exec={exec as BuyExecutionPlan} />
  );
}

const meta: Meta<typeof RentBuyConfirmDialogStory> = {
  title: "Land Manager/Bulk Operations/ConfirmDialog",
  component: RentBuyConfirmDialogStory,
  argTypes: {
    mode: {
      control: "radio",
      options: ["rent", "buy"],
    },
  },
  args: {
    mode: "rent",
    decBalance: 5000,
    busy: false,
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof RentBuyConfirmDialogStory>;

export const FewPlots: Story = {
  args: {
    items: [
      makeItem(1, 1, 1, 5, 0),
      makeItem(1, 1, 2, 3, 5),
      makeItem(1, 2, 1, 5, 8),
      makeItem(1, 2, 2, 4, 13),
      makeItem(1, 2, 3, 5, 17),
    ],
  },
};

export const WithSlotShortage: Story = {
  args: {
    withShortage: true,
    items: [
      makeItem(1, 1, 1, 5, 0),
      makeItem(1, 1, 2, 3, 5),
      makeItem(1, 2, 1, 5, 8),
    ],
  },
};

export const LargeRegion: Story = {
  args: {
    items: (() => {
      const items: WorkerPlanItem[] = [];
      let pickOffset = 0;

      for (let tract = 1; tract <= 20; tract++) {
        for (let plot = 1; plot <= 50; plot++) {
          items.push(makeItem(65, tract, plot, 5, pickOffset));
          pickOffset += 5;
        }
      }

      return items;
    })(),
  },
};

export const NoPicks: Story = {
  args: {
    items: [],
  },
};

export const Busy: Story = {
  args: {
    busy: true,
    items: [makeItem(1, 1, 1, 5, 0), makeItem(1, 1, 2, 5, 5)],
  },
};
