import { RentalExecutionPlan } from "@/lib/backend/actions/land-manager/rental-actions";
import {
  DEFAULT_RENTAL_CONFIG,
  RentalEligiblePlot,
  RentalPlanItem,
  RentalPlanPick,
} from "@/types/landManager";
import type { Meta, StoryObj } from "@storybook/react";
import RentConfirmDialog from "./RentConfirmDialog";

// ── Mock helpers ──────────────────────────────────────────────────────────────

const CARD_NAMES = [
  "Charlok Minotaur",
  "Radiated Scorcher",
  "Goblin Firebomb",
  "Serpent of Eld",
  "Exploding Rats",
];

const RESOURCES = ["GRAIN", "WOOD", "STONE", "IRON", "GRAIN"];

function makePlot(
  region: number,
  tract: number,
  plot: number,
  emptySlots = 5
): RentalEligiblePlot {
  return {
    deed_uid: `${region}-${tract}-${plot}`,
    plot_id: region * 10000 + tract * 100 + plot,
    plot_number: plot,
    tract_number: tract,
    region_uid: `region-${region}`,
    region_number: region,
    resource_symbol: RESOURCES[(region + tract + plot) % RESOURCES.length],
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

function makePick(idx: number): RentalPlanPick {
  const decPerDay = 4 + (idx % 5);
  const days = 14;
  return {
    market_id: `mkt-${idx}`,
    card_uid: `card-${idx}`,
    card_detail_id: 100 + (idx % CARD_NAMES.length),
    card_name: CARD_NAMES[idx % CARD_NAMES.length],
    edition: 1,
    foil: 0,
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
    card_image_url: "",
  };
}

function makeItem(
  region: number,
  tract: number,
  plot: number,
  pickCount: number,
  pickOffset = 0
): RentalPlanItem {
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
  items: RentalPlanItem[],
  withShortage = false
): RentalExecutionPlan {
  const totals = {
    plots_total: items.length,
    plots_with_picks: items.length,
    slots_total: items.reduce((s, i) => s + i.plot.empty_slots, 0),
    slots_filled: items.reduce((s, i) => s + i.slots_filled, 0),
    total_dec: items.reduce((s, i) => s + i.plot_total_dec, 0),
  };

  const emptySlotsByDeed: Record<string, number[]> = {};
  items.forEach((item, idx) => {
    // Simulate one plot having a slot shortage to test the warning banner.
    const shortage = withShortage && idx === 0;
    const available = shortage ? item.picks.length - 1 : item.plot.empty_slots;
    emptySlotsByDeed[item.plot.deed_uid] = Array.from(
      { length: available },
      (_, i) => i + 1
    );
  });

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

// ── Stories ───────────────────────────────────────────────────────────────────

const meta: Meta<typeof RentConfirmDialog> = {
  title: "Land Manager/Bulk Operations/RentConfirmDialog",
  component: RentConfirmDialog,
  args: {
    busy: false,
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof RentConfirmDialog>;

/** A small region — 5 plots, all fully filled. */
export const FewPlots: Story = {
  args: {
    exec: makeExecPlan([
      makeItem(1, 1, 1, 5, 0),
      makeItem(1, 1, 2, 3, 5),
      makeItem(1, 2, 1, 5, 8),
      makeItem(1, 2, 2, 4, 13),
      makeItem(1, 2, 3, 5, 17),
    ]),
  },
};

/** Shows the slot-shortage warning when one plot has fewer free slots than picks. */
export const WithSlotShortage: Story = {
  args: {
    exec: makeExecPlan(
      [
        makeItem(1, 1, 1, 5, 0),
        makeItem(1, 1, 2, 3, 5),
        makeItem(1, 2, 1, 5, 8),
      ],
      true
    ),
  },
};

/** Simulates a 1 000-plot region (20 tracts × 50 plots). */
export const LargeRegion: Story = {
  args: {
    exec: (() => {
      const items: RentalPlanItem[] = [];
      let pickOffset = 0;
      for (let tract = 1; tract <= 20; tract++) {
        for (let plot = 1; plot <= 50; plot++) {
          items.push(makeItem(65, tract, plot, 5, pickOffset));
          pickOffset += 5;
        }
      }
      return makeExecPlan(items);
    })(),
  },
};

/** Shows the "no picks" state. */
export const NoPicks: Story = {
  args: {
    exec: makeExecPlan([]),
  },
};

/** Shows the busy/loading state during execution. */
export const Busy: Story = {
  args: {
    busy: true,
    exec: makeExecPlan([makeItem(1, 1, 1, 5, 0), makeItem(1, 1, 2, 5, 5)]),
  },
};
